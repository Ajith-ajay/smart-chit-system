import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@/modules/auth/interfaces/authenticated-user.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReversePaymentDto } from './dto/reverse-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post('enrollments/:enrollmentId')
  @ApiOperation({ summary: 'Collect and allocate a payment for an enrollment' })
  create(
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(enrollmentId, dto, user.id);
  }

  @Get('enrollments/:enrollmentId/summary')
  @ApiOperation({
    summary: 'Get payment balance and installment status for an enrollment',
  })
  summary(@Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string) {
    return this.service.summary(enrollmentId);
  }

  @Get('enrollments/:enrollmentId')
  @ApiOperation({
    summary:
      'List payment history and installment allocations for an enrollment',
  })
  forEnrollment(
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
  ) {
    return this.service.forEnrollment(enrollmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment with its installment allocations' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/reverse')
  @ApiOperation({
    summary: 'Reverse a collected payment without deleting financial history',
  })
  reverse(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReversePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reverse(id, dto, user.id);
  }
}
