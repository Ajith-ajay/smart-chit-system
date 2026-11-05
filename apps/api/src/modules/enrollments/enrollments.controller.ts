import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/modules/auth/interfaces/authenticated-user.interface';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { CatchUpEnrollmentDto } from './dto/catch-up-enrollment.dto';
import { CatchUpPreviewDto } from './dto/catch-up-preview.dto';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller({ path: 'enrollments', version: '1' })
export class EnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Get('available-batches')
  @ApiOperation({
    summary:
      'List joinable batches with their available chit plans and schedules',
  })
  availableBatches() {
    return this.service.availableBatches();
  }

  @Get('members/:memberId')
  @ApiOperation({ summary: 'List a member’s enrollments' })
  forMember(@Param('memberId', new ParseUUIDPipe()) memberId: string) {
    return this.service.forMember(memberId);
  }

  @Post('members/:memberId')
  @ApiOperation({ summary: 'Enroll an active member in a DRAFT batch' })
  create(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Body() dto: CreateEnrollmentDto,
  ) {
    return this.service.create(memberId, dto);
  }

  @Get('members/:memberId/catch-up-preview')
  @ApiOperation({
    summary: 'Preview installments and amount required to join a RUNNING batch',
  })
  catchUpPreview(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Query() dto: CatchUpPreviewDto,
  ) {
    return this.service.catchUpPreview(memberId, dto.batchId, dto.batchPlanId);
  }

  @Post('members/:memberId/catch-up')
  @ApiOperation({
    summary:
      'Enroll into a RUNNING batch and collect required catch-up installments atomically',
  })
  catchUp(
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
    @Body() dto: CatchUpEnrollmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.catchUp(memberId, dto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'List enrollments with pagination, search and filters',
  })
  findAll(@Query() query: EnrollmentQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enrollment details by ID' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }
}
