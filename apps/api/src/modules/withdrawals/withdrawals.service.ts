import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WithdrawalsRepository } from './withdrawals.repository';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ApproveWithdrawalDto } from './dto/approve-withdrawal.dto';
import { RejectWithdrawalDto } from './dto/reject-withdrawal.dto';
import { CreatePayoutDto } from './dto/create-payout.dto';

@Injectable()
export class WithdrawalsService {
  constructor(private readonly repository: WithdrawalsRepository) {}

  eligibleInstallments(enrollmentId: string) {
    return this.repository.eligibleInstallments(enrollmentId);
  }

  async forEnrollment(enrollmentId: string) {
    const enrollment = await this.repository.findEnrollment(enrollmentId);
    if (!enrollment)
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    return this.repository.findForEnrollment(enrollmentId);
  }

  async findOne(id: string) {
    const withdrawal = await this.repository.findOne(id);
    if (!withdrawal)
      throw new NotFoundException(`Withdrawal with ID ${id} not found`);
    return withdrawal;
  }

  async create(enrollmentId: string, dto: CreateWithdrawalDto, userId: string) {
    const amount = positive(dto.requestedAmount, 'Requested amount');
    const requestedAt = new Date(dto.requestedAt);
    if (Number.isNaN(requestedAt.getTime()))
      throw new UnprocessableEntityException('Invalid requestedAt.');
    return this.repository.createWithdrawal(
      enrollmentId,
      dto.batchInstallmentId,
      amount,
      requestedAt,
      dto.remarks?.trim(),
      userId,
    );
  }

  async approve(id: string, dto: ApproveWithdrawalDto, userId: string) {
    return this.repository.approve(
      id,
      positive(dto.approvedAmount, 'Approved amount'),
      dto.remarks?.trim(),
      userId,
    );
  }

  async reject(id: string, dto: RejectWithdrawalDto, userId: string) {
    return this.repository.reject(id, dto.reason.trim(), userId);
  }

  async createPayout(id: string, dto: CreatePayoutDto, userId: string) {
    const amount = positive(dto.amount, 'Payout amount');
    const payoutDate = new Date(dto.payoutDate);
    if (Number.isNaN(payoutDate.getTime()))
      throw new UnprocessableEntityException('Invalid payoutDate.');
    return this.repository.createPayout(
      id,
      amount,
      payoutDate,
      dto.paymentMethod,
      dto.referenceNumber?.trim(),
      dto.remarks?.trim(),
      userId,
    );
  }

  reversePayout(id: string, reason: string, userId: string) {
    if (!reason.trim())
      throw new UnprocessableEntityException('Reversal reason is required.');
    return this.repository.reversePayout(id, reason.trim(), userId);
  }
}

function positive(value: string, label: string) {
  const amount = new Prisma.Decimal(value);
  if (!amount.isFinite() || amount.lte(0))
    throw new UnprocessableEntityException(
      `${label} must be greater than zero.`,
    );
  return amount;
}
