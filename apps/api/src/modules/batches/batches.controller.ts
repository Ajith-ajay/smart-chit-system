import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BatchStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { BatchesService } from './batches.service';
import { BatchLifecycleService } from './batch-lifecycle.service';
import { ProcessBatchLifecycleDto } from './dto/process-batch-lifecycle.dto';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/modules/auth/interfaces/authenticated-user.interface';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { AddBatchPlanDto } from './dto/add-batch-plan.dto';

@ApiTags('Batches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller({ path: 'batches', version: '1' })
export class BatchesController {
  constructor(
    private readonly service: BatchesService,
    private readonly lifecycle: BatchLifecycleService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a 20-installment batch with one or more chit plans',
  })
  @ApiResponse({
    status: 201,
    description: 'Batch created with its monthly installment schedule.',
  })
  create(@Body() dto: CreateBatchDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List batches' })
  findAll(
    @Query('status', new ParseEnumPipe(BatchStatus, { optional: true }))
    status?: BatchStatus,
  ) {
    return this.service.findAll(status);
  }

  @Post('lifecycle/process-all')
  @ApiOperation({ summary: 'Process all due DRAFT/RUNNING batches' })
  processAllLifecycle(
    @Body() dto: ProcessBatchLifecycleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const asOfDate = dto.asOfDate ? new Date(dto.asOfDate) : new Date();
    return this.lifecycle.processAll(asOfDate, user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a batch with plans, installments and enrollment count',
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a DRAFT batch' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBatchDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/plans')
  @ApiOperation({ summary: 'Add a chit plan to a DRAFT batch' })
  addPlan(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddBatchPlanDto,
  ) {
    return this.service.addPlan(id, dto);
  }

  @Delete(':id/plans/:planTemplateId')
  @ApiOperation({ summary: 'Remove a chit plan from a DRAFT batch' })
  removePlan(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('planTemplateId', new ParseUUIDPipe()) planTemplateId: string,
  ) {
    return this.service.removePlan(id, planTemplateId);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a DRAFT batch and activate installment 1' })
  start(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.start(id);
  }

  @Post(':id/lifecycle/process')
  @ApiOperation({
    summary: 'Process batch lifecycle for due installments and completion',
  })
  processLifecycle(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ProcessBatchLifecycleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lifecycle.process(id, dto, user.id);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary:
      'Complete a RUNNING batch after all installments and enrollments are closed',
  })
  complete(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.complete(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a batch with no active enrollments' })
  cancel(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.cancel(id);
  }
}
