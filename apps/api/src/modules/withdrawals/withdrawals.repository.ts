import { PrismaService } from '@/common/prisma/prisma.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  PaymentMethod,
  Prisma,
  WithdrawalPayoutStatus,
  WithdrawalStatus,
} from '@prisma/client';

@Injectable()
export class WithdrawalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEnrollment(id: string) {
    return this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        batch: true,
        batchPlan: { include: { planTemplate: true } },
        member: true,
      },
    });
  }

  eligibleInstallments(enrollmentId: string) {
    return this.prisma.batchInstallment.findMany({
      where: {
        batchPlan: { enrollments: { some: { id: enrollmentId } } },
        dueDate: { lte: new Date() },
        withdrawalAmount: { gt: 0 },
        withdrawals: {
          none: {
            enrollmentId,
          },
        },
      },
      orderBy: { installmentNumber: 'asc' },
      select: {
        id: true,
        installmentNumber: true,
        dueDate: true,
        withdrawalAmount: true,
        status: true,
      },
    });
  }

  findForEnrollment(enrollmentId: string) {
    return this.prisma.withdrawal.findMany({
      where: { enrollmentId },
      orderBy: { requestedAt: 'desc' },
      include: {
        batchInstallment: true,
        payouts: { orderBy: { payoutDate: 'asc' } },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.withdrawal.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: {
            member: true,
            batch: true,
            batchPlan: { include: { planTemplate: true } },
          },
        },
        batchInstallment: true,
        payouts: true,
      },
    });
  }

  async createWithdrawal(
    enrollmentId: string,
    installmentId: string,
    requestedAmount: Prisma.Decimal,
    requestedAt: Date,
    remarks: string | undefined,
    userId: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const enrollment = await tx.enrollment.findUnique({
          where: { id: enrollmentId },
          select: {
            id: true,
            status: true,
            batchId: true,
            batchPlanId: true,
            batch: { select: { status: true } },
          },
        });
        if (!enrollment) throw new NotFoundException('Enrollment not found.');
        if (enrollment.status !== 'ACTIVE')
          throw new UnprocessableEntityException(
            'Withdrawal requires an active enrollment.',
          );
        if (
          enrollment.batch.status === 'COMPLETED' ||
          enrollment.batch.status === 'CANCELLED'
        )
          throw new UnprocessableEntityException(
            'Withdrawals cannot be created for a closed batch.',
          );

        const installment = await tx.batchInstallment.findFirst({
          where: {
            id: installmentId,
            batchId: enrollment.batchId,
            batchPlanId: enrollment.batchPlanId,
          },
        });
        if (!installment)
          throw new NotFoundException(
            'The installment does not belong to this enrollment plan.',
          );
        if (installment.dueDate > requestedAt)
          throw new UnprocessableEntityException(
            'Withdrawal is not eligible before the installment due date.',
          );
        if (installment.withdrawalAmount.lte(0))
          throw new UnprocessableEntityException(
            'This installment has no withdrawal amount.',
          );
        if (requestedAmount.gt(installment.withdrawalAmount))
          throw new UnprocessableEntityException(
            'Requested amount cannot exceed the scheduled withdrawal amount.',
          );

        const existing = await tx.withdrawal.findUnique({
          where: {
            enrollmentId_batchInstallmentId: {
              enrollmentId,
              batchInstallmentId: installmentId,
            },
          },
        });
        if (existing)
          throw new ConflictException(
            'A withdrawal already exists for this installment.',
          );

        const withdrawal = await tx.withdrawal.create({
          data: {
            enrollmentId,
            batchInstallmentId: installmentId,
            requestedAmount,
            requestedAt,
            status: WithdrawalStatus.PENDING,
            remarks,
            createdById: userId,
          },
        });
        await tx.auditLog.create({
          data: {
            userId,
            action: 'WITHDRAWAL_REQUESTED',
            entityName: 'Withdrawal',
            entityId: withdrawal.id,
            newValue: {
              requestedAmount: requestedAmount.toFixed(2),
              batchInstallmentId: installmentId,
            },
          },
        });
        return withdrawal;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async approve(
    id: string,
    approvedAmount: Prisma.Decimal,
    remarks: string | undefined,
    userId: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const withdrawal = await tx.withdrawal.findUnique({
          where: { id },
          include: { batchInstallment: true },
        });
        if (!withdrawal) throw new NotFoundException('Withdrawal not found.');
        if (withdrawal.status !== WithdrawalStatus.PENDING)
          throw new ConflictException(
            'Only PENDING withdrawals can be approved.',
          );
        if (
          approvedAmount.lte(0) ||
          approvedAmount.gt(withdrawal.requestedAmount) ||
          approvedAmount.gt(withdrawal.batchInstallment.withdrawalAmount)
        )
          throw new UnprocessableEntityException(
            'Approved amount must not exceed the requested or scheduled withdrawal amount.',
          );
        const updated = await tx.withdrawal.update({
          where: { id },
          data: {
            approvedAmount,
            approvedAt: new Date(),
            approvedById: userId,
            status: WithdrawalStatus.APPROVED,
            remarks,
          },
        });
        await tx.auditLog.create({
          data: {
            userId,
            action: 'WITHDRAWAL_APPROVED',
            entityName: 'Withdrawal',
            entityId: id,
            previousValue: { status: withdrawal.status },
            newValue: {
              status: updated.status,
              approvedAmount: approvedAmount.toFixed(2),
            },
          },
        });
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async reject(id: string, reason: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({ where: { id } });
      if (!withdrawal) throw new NotFoundException('Withdrawal not found.');
      if (withdrawal.status !== WithdrawalStatus.PENDING)
        throw new ConflictException(
          'Only PENDING withdrawals can be rejected.',
        );
      const updated = await tx.withdrawal.update({
        where: { id },
        data: { status: WithdrawalStatus.REJECTED, remarks: reason },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'WITHDRAWAL_REJECTED',
          entityName: 'Withdrawal',
          entityId: id,
          previousValue: { status: withdrawal.status },
          newValue: { status: updated.status },
          reason,
        },
      });
      return updated;
    });
  }

  async createPayout(
    id: string,
    amount: Prisma.Decimal,
    payoutDate: Date,
    paymentMethod: PaymentMethod,
    referenceNumber: string | undefined,
    remarks: string | undefined,
    userId: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const withdrawal = await tx.withdrawal.findUnique({
          where: { id },
          include: { payouts: true },
        });
        if (!withdrawal) throw new NotFoundException('Withdrawal not found.');
        if (
          withdrawal.status !== WithdrawalStatus.APPROVED &&
          withdrawal.status !== WithdrawalStatus.PAID
        )
          throw new UnprocessableEntityException(
            'Payouts can only be made for approved withdrawals.',
          );
        if (!withdrawal.approvedAmount)
          throw new UnprocessableEntityException(
            'Withdrawal has no approved amount.',
          );
        const paid = withdrawal.payouts
          .filter((p) => p.status !== WithdrawalPayoutStatus.REVERSED)
          .reduce((s, p) => s.plus(p.amount), new Prisma.Decimal(0));
        if (paid.plus(amount).gt(withdrawal.approvedAmount))
          throw new UnprocessableEntityException(
            'Payout would exceed the approved withdrawal amount.',
          );

        const payout = await tx.withdrawalPayout.create({
          data: {
            withdrawalId: id,
            amount,
            payoutDate,
            paymentMethod,
            referenceNumber,
            remarks,
            status: WithdrawalPayoutStatus.PAID,
            createdById: userId,
          },
        });
        const newPaid = paid.plus(amount);
        const status = newPaid.eq(withdrawal.approvedAmount)
          ? WithdrawalStatus.PAID
          : WithdrawalStatus.APPROVED;
        await tx.withdrawal.update({ where: { id }, data: { status } });
        await tx.auditLog.create({
          data: {
            userId,
            action: 'WITHDRAWAL_PAYOUT_CREATED',
            entityName: 'WithdrawalPayout',
            entityId: payout.id,
            newValue: {
              withdrawalId: id,
              amount: amount.toFixed(2),
              totalPaid: newPaid.toFixed(2),
              withdrawalStatus: status,
            },
          },
        });
        return tx.withdrawalPayout.findUniqueOrThrow({
          where: { id: payout.id },
          include: { withdrawal: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async reversePayout(id: string, reason: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.withdrawalPayout.findUnique({
        where: { id },
        include: { withdrawal: { include: { payouts: true } } },
      });
      if (!payout) throw new NotFoundException('Payout not found.');
      if (payout.status === WithdrawalPayoutStatus.REVERSED)
        throw new ConflictException('Payout is already reversed.');
      const updated = await tx.withdrawalPayout.update({
        where: { id },
        data: {
          status: WithdrawalPayoutStatus.REVERSED,
          reversalReason: reason,
          reversedAt: new Date(),
        },
      });
      const activePaid = payout.withdrawal.payouts
        .filter((p) => p.status === WithdrawalPayoutStatus.PAID && p.id !== id)
        .reduce((s, p) => s.plus(p.amount), new Prisma.Decimal(0));
      const newStatus = activePaid.eq(payout.withdrawal.approvedAmount ?? 0)
        ? WithdrawalStatus.PAID
        : WithdrawalStatus.APPROVED;
      await tx.withdrawal.update({
        where: { id: payout.withdrawalId },
        data: { status: newStatus },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'WITHDRAWAL_PAYOUT_REVERSED',
          entityName: 'WithdrawalPayout',
          entityId: id,
          previousValue: { status: payout.status },
          newValue: { status: updated.status, withdrawalStatus: newStatus },
          reason,
        },
      });
      return updated;
    });
  }
}
