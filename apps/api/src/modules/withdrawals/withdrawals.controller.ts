import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/modules/auth/interfaces/authenticated-user.interface';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ApproveWithdrawalDto } from './dto/approve-withdrawal.dto';
import { RejectWithdrawalDto } from './dto/reject-withdrawal.dto';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { ReversePayoutDto } from './dto/reverse-payout.dto';

@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalsController {
  constructor(private readonly service: WithdrawalsService) {}

  @Get('enrollments/:enrollmentId/eligible')
  eligible(@Param('enrollmentId') enrollmentId: string) {
    return this.service.eligibleInstallments(enrollmentId);
  }

  @Get('enrollments/:enrollmentId')
  list(@Param('enrollmentId') enrollmentId: string) {
    return this.service.forEnrollment(enrollmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('enrollments/:enrollmentId')
  create(
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: CreateWithdrawalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(enrollmentId, dto, user.id);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveWithdrawalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.approve(id, dto, user.id);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectWithdrawalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reject(id, dto, user.id);
  }

  @Post(':id/payouts')
  payout(
    @Param('id') id: string,
    @Body() dto: CreatePayoutDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createPayout(id, dto, user.id);
  }

  @Post('/payouts/:payoutId/reverse')
  reversePayout(
    @Param('payoutId') payoutId: string,
    @Body() dto: ReversePayoutDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reversePayout(payoutId, dto.reason, user.id);
  }
}
