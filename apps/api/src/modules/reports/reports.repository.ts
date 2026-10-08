import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(from?: Date, to?: Date) {
    const paymentWhere: Prisma.PaymentWhereInput = {
      status: { not: 'REVERSED' },
      ...(from || to
        ? {
            paymentDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };
    const payoutWhere: Prisma.WithdrawalPayoutWhereInput = {
      status: 'PAID',
      ...(from || to
        ? {
            payoutDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [
      members,
      activeEnrollments,
      runningBatches,
      completedBatches,
      payments,
      payouts,
      pendingWithdrawals,
    ] = await Promise.all([
      this.prisma.member.count({
        where: { deletedAt: null, status: 'ACTIVE' },
      }),
      this.prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      this.prisma.batch.count({ where: { status: 'RUNNING' } }),
      this.prisma.batch.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.withdrawalPayout.aggregate({
        where: payoutWhere,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.withdrawal.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      members: { active: members },
      enrollments: { active: activeEnrollments },
      batches: { running: runningBatches, completed: completedBatches },
      collections: {
        transactionCount: payments._count._all,
        amount: payments._sum.amount?.toFixed(2) ?? '0.00',
      },
      payouts: {
        transactionCount: payouts._count._all,
        amount: payouts._sum.amount?.toFixed(2) ?? '0.00',
      },
      withdrawals: { pending: pendingWithdrawals },
    };
  }

  async batch(batchId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { plans: { include: { planTemplate: true } } },
    });
    if (!batch) return null;

    const [enrollments, installments, payments, withdrawals, payouts] =
      await Promise.all([
        this.prisma.enrollment.groupBy({
          by: ['batchPlanId', 'status'],
          where: { batchId },
          _count: { _all: true },
        }),
        this.prisma.batchInstallment.findMany({
          where: { batchId },
          orderBy: [{ dueDate: 'asc' }, { installmentNumber: 'asc' }],
        }),
        this.prisma.payment.aggregate({
          where: { enrollment: { batchId }, status: { not: 'REVERSED' } },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.withdrawal.aggregate({
          where: {
            enrollment: { batchId },
            status: { in: ['PENDING', 'APPROVED', 'PAID'] },
          },
          _sum: { approvedAmount: true },
          _count: { _all: true },
        }),
        this.prisma.withdrawalPayout.aggregate({
          where: { withdrawal: { enrollment: { batchId } }, status: 'PAID' },
          _sum: { amount: true },
        }),
      ]);

    const planStats = batch.plans.map((plan) => {
      const rows = enrollments.filter((row) => row.batchPlanId === plan.id);
      const active =
        rows.find((row) => row.status === 'ACTIVE')?._count._all ?? 0;
      const completed =
        rows.find((row) => row.status === 'COMPLETED')?._count._all ?? 0;
      const cancelled =
        rows.find((row) => row.status === 'CANCELLED')?._count._all ?? 0;
      return {
        batchPlanId: plan.id,
        planName: plan.planTemplate.name,
        active,
        completed,
        cancelled,
      };
    });

    return {
      batch: {
        id: batch.id,
        name: batch.name,
        startDate: batch.startDate,
        status: batch.status,
      },
      plans: planStats,
      installments: {
        total: installments.length,
        pending: installments.filter((i) => i.status === 'PENDING').length,
        active: installments.filter((i) => i.status === 'ACTIVE').length,
        completed: installments.filter((i) => i.status === 'COMPLETED').length,
      },
      collections: {
        transactionCount: payments._count._all,
        amount: payments._sum.amount?.toFixed(2) ?? '0.00',
      },
      withdrawals: {
        requestCount: withdrawals._count._all,
        approvedAmount: withdrawals._sum.approvedAmount?.toFixed(2) ?? '0.00',
        paidAmount: payouts._sum.amount?.toFixed(2) ?? '0.00',
      },
    };
  }

  async enrollment(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        member: true,
        batch: true,
        batchPlan: { include: { planTemplate: true } },
      },
    });
    if (!enrollment) return null;

    const installments = await this.prisma.batchInstallment.findMany({
      where: { batchPlanId: enrollment.batchPlanId },
      orderBy: { installmentNumber: 'asc' },
      include: { payments: { include: { payment: true } } },
    });

    const rows = installments.map((i) => {
      const paid = i.payments.reduce(
        (sum, allocation) =>
          allocation.payment.status === 'REVERSED'
            ? sum
            : sum.plus(allocation.amount),
        new Prisma.Decimal(0),
      );
      const remaining = Prisma.Decimal.max(
        new Prisma.Decimal(0),
        i.installmentAmount.minus(paid),
      );
      return {
        installmentNumber: i.installmentNumber,
        dueDate: i.dueDate,
        scheduledAmount: i.installmentAmount.toFixed(2),
        paidAmount: paid.toFixed(2),
        remainingAmount: remaining.toFixed(2),
        status: i.status,
      };
    });

    const [payments, withdrawals, payouts] = await Promise.all([
      this.prisma.payment.findMany({
        where: { enrollmentId },
        orderBy: { paymentDate: 'desc' },
        include: {
          allocations: { include: { batchInstallment: true } },
          receipts: true,
        },
      }),
      this.prisma.withdrawal.findMany({
        where: { enrollmentId },
        orderBy: { requestedAt: 'desc' },
      }),
      this.prisma.withdrawalPayout.findMany({
        where: { withdrawal: { enrollmentId } },
        orderBy: { payoutDate: 'desc' },
      }),
    ]);

    const scheduled = rows.reduce(
      (s, r) => s.plus(r.scheduledAmount),
      new Prisma.Decimal(0),
    );
    const paid = rows.reduce(
      (s, r) => s.plus(r.paidAmount),
      new Prisma.Decimal(0),
    );
    const outstanding = Prisma.Decimal.max(
      new Prisma.Decimal(0),
      scheduled.minus(paid),
    );
    const payoutTotal = payouts
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s.plus(p.amount), new Prisma.Decimal(0));

    return {
      enrollment: {
        id: enrollment.id,
        number: enrollment.enrollmentNumber,
        status: enrollment.status,
      },
      member: {
        id: enrollment.member.id,
        name: `${enrollment.member.firstName} ${enrollment.member.lastName}`,
        phone: enrollment.member.phone,
      },
      batch: { id: enrollment.batch.id, name: enrollment.batch.name },
      plan: {
        id: enrollment.batchPlan.id,
        name: enrollment.batchPlan.planTemplate.name,
      },
      summary: {
        scheduledAmount: scheduled.toFixed(2),
        paidAmount: paid.toFixed(2),
        outstandingAmount: outstanding.toFixed(2),
        payoutAmount: payoutTotal.toFixed(2),
      },
      installments: rows,
      payments,
      withdrawals,
      payouts,
    };
  }

  async collectionReport(from?: Date, to?: Date) {
    const where: Prisma.PaymentWhereInput = {
      status: { not: 'REVERSED' },
      ...(from || to
        ? {
            paymentDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };
    const rows = await this.prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'asc' },
      include: {
        enrollment: {
          include: {
            member: true,
            batch: true,
            batchPlan: { include: { planTemplate: true } },
          },
        },
        allocations: { include: { batchInstallment: true } },
        receipts: true,
      },
    });
    return rows.map((p) => ({
      paymentId: p.id,
      paymentDate: p.paymentDate,
      amount: p.amount.toFixed(2),
      method: p.paymentMethod,
      referenceNumber: p.referenceNumber,
      enrollmentNumber: p.enrollment.enrollmentNumber,
      memberName: `${p.enrollment.member.firstName} ${p.enrollment.member.lastName}`,
      batchName: p.enrollment.batch.name,
      planName: p.enrollment.batchPlan.planTemplate.name,
      receiptNumber:
        p.receipts.find((r) => r.status === 'ACTIVE')?.receiptNumber ?? null,
      allocations: p.allocations.map((a) => ({
        installmentNumber: a.batchInstallment.installmentNumber,
        amount: a.amount.toFixed(2),
      })),
    }));
  }

  async withdrawalReport(from?: Date, to?: Date) {
    const where: Prisma.WithdrawalWhereInput = {
      ...(from || to
        ? {
            requestedAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };
    const rows = await this.prisma.withdrawal.findMany({
      where,
      orderBy: { requestedAt: 'asc' },
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
    return rows.map((w) => ({
      withdrawalId: w.id,
      requestedAt: w.requestedAt,
      status: w.status,
      requestedAmount: w.requestedAmount.toFixed(2),
      approvedAmount: w.approvedAmount?.toFixed(2) ?? null,
      installmentNumber: w.batchInstallment.installmentNumber,
      memberName: `${w.enrollment.member.firstName} ${w.enrollment.member.lastName}`,
      enrollmentNumber: w.enrollment.enrollmentNumber,
      batchName: w.enrollment.batch.name,
      planName: w.enrollment.batchPlan.planTemplate.name,
      payouts: w.payouts.map((p) => ({
        id: p.id,
        date: p.payoutDate,
        amount: p.amount.toFixed(2),
        status: p.status,
        method: p.paymentMethod,
      })),
    }));
  }
}
