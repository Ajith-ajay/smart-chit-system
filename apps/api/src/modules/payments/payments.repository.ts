import { PrismaService } from '@/common/prisma/prisma.service';
import {
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEnrollment(id: string) {
    return this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        batch: {
          select: { id: true, name: true, status: true, startDate: true },
        },
        batchPlan: { include: { planTemplate: true } },
      },
    });
  }

  findPayment(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            batch: true,
            batchPlan: { include: { planTemplate: true } },
          },
        },
        allocations: {
          include: {
            batchInstallment: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async getEnrollmentSummary(enrollmentId: string) {
    const enrollment = await this.findEnrollment(enrollmentId);
    if (!enrollment) return null;

    const installments = await this.prisma.batchInstallment.findMany({
      where: { batchPlanId: enrollment.batchPlanId },
      orderBy: { installmentNumber: 'asc' },
    });

    const paidRows = await this.prisma.paymentAllocation.groupBy({
      by: ['batchInstallmentId'],
      where: {
        batchInstallmentId: { in: installments.map((i) => i.id) },
        payment: { enrollmentId, status: { not: PaymentStatus.REVERSED } },
      },
      _sum: { amount: true },
    });

    const paidByInstallment = new Map(
      paidRows.map((row) => [
        row.batchInstallmentId,
        row._sum.amount ?? new Prisma.Decimal(0),
      ]),
    );

    const installmentSummary = installments.map((installment) => {
      const paid =
        paidByInstallment.get(installment.id) ?? new Prisma.Decimal(0);
      const remaining = Prisma.Decimal.max(
        new Prisma.Decimal(0),
        installment.installmentAmount.minus(paid),
      );
      return {
        id: installment.id,
        installmentNumber: installment.installmentNumber,
        dueDate: installment.dueDate,
        scheduledAmount: installment.installmentAmount,
        paidAmount: paid,
        remainingAmount: remaining,
        scheduleStatus: installment.status,
        isPaid: remaining.eq(0),
      };
    });

    const totalScheduled = installmentSummary.reduce(
      (sum, item) => sum.plus(item.scheduledAmount),
      new Prisma.Decimal(0),
    );
    const totalPaid = installmentSummary.reduce(
      (sum, item) => sum.plus(item.paidAmount),
      new Prisma.Decimal(0),
    );

    return {
      enrollmentId,
      plan: {
        id: enrollment.batchPlan.planTemplate.id,
        name: enrollment.batchPlan.planTemplate.name,
        totalAmount: enrollment.batchPlan.planTemplate.totalAmount,
        installmentCount: enrollment.batchPlan.planTemplate.installmentCount,
      },
      totalScheduled,
      totalPaid,
      outstandingAmount: totalScheduled.minus(totalPaid),
      paidInstallments: installmentSummary.filter((i) => i.isPaid).length,
      remainingInstallments: installmentSummary.filter((i) => !i.isPaid).length,
      installments: installmentSummary,
    };
  }

  findEnrollmentPayments(enrollmentId: string) {
    return this.prisma.payment.findMany({
      where: { enrollmentId },
      orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        allocations: {
          include: { batchInstallment: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async createPayment(args: {
    enrollmentId: string;
    amount: Prisma.Decimal;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    remarks?: string;
    createdById: string;
    requestedAllocations?: Array<{
      batchInstallmentId: string;
      amount: Prisma.Decimal;
    }>;
  }) {
    return this.prisma.$transaction(
      async (tx) => {
        const enrollment = await tx.enrollment.findUnique({
          where: { id: args.enrollmentId },
          select: { id: true, batchPlanId: true, status: true },
        });
        if (!enrollment) throw new Error('Enrollment not found');

        const installments = await tx.batchInstallment.findMany({
          where: { batchPlanId: enrollment.batchPlanId },
          orderBy: { installmentNumber: 'asc' },
        });

        const allocations = await this.resolveAllocations(
          tx,
          args.enrollmentId,
          installments,
          args.amount,
          args.requestedAllocations,
        );

        const payment = await tx.payment.create({
          data: {
            enrollmentId: args.enrollmentId,
            amount: args.amount,
            paymentDate: args.paymentDate,
            paymentMethod: args.paymentMethod,
            referenceNumber: args.referenceNumber,
            remarks: args.remarks,
            status: PaymentStatus.FULLY_ALLOCATED,
            createdById: args.createdById,
          },
        });

        await tx.paymentAllocation.createMany({
          data: allocations.map((allocation) => ({
            paymentId: payment.id,
            batchInstallmentId: allocation.batchInstallmentId,
            amount: allocation.amount,
          })),
        });

        await tx.auditLog.create({
          data: {
            userId: args.createdById,
            action: 'PAYMENT_CREATED',
            entityName: 'Payment',
            entityId: payment.id,
            newValue: {
              amount: args.amount.toFixed(2),
              paymentDate: args.paymentDate.toISOString(),
              paymentMethod: args.paymentMethod,
              allocations: allocations.map((a) => ({
                batchInstallmentId: a.batchInstallmentId,
                amount: a.amount.toFixed(2),
              })),
            },
          },
        });

        return tx.payment.findUniqueOrThrow({
          where: { id: payment.id },
          include: {
            enrollment: {
              include: {
                member: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
                batch: true,
                batchPlan: { include: { planTemplate: true } },
              },
            },
            allocations: {
              include: { batchInstallment: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async resolveAllocations(
    tx: Prisma.TransactionClient,
    enrollmentId: string,
    installments: Array<{
      id: string;
      installmentNumber: number;
      installmentAmount: Prisma.Decimal;
      status: string;
      dueDate: Date;
    }>,
    paymentAmount: Prisma.Decimal,
    requestedAllocations?: Array<{
      batchInstallmentId: string;
      amount: Prisma.Decimal;
    }>,
  ) {
    const paidRows = await tx.paymentAllocation.groupBy({
      by: ['batchInstallmentId'],
      where: {
        batchInstallmentId: { in: installments.map((i) => i.id) },
        payment: {
          enrollmentId,
          status: { not: PaymentStatus.REVERSED },
        },
      },
      _sum: { amount: true },
    });

    const paidByInstallment = new Map(
      paidRows.map((row) => [
        row.batchInstallmentId,
        row._sum.amount ?? new Prisma.Decimal(0),
      ]),
    );

    const outstanding = installments
      .map((installment) => {
        const paid =
          paidByInstallment.get(installment.id) ?? new Prisma.Decimal(0);
        return {
          ...installment,
          remainingAmount: Prisma.Decimal.max(
            new Prisma.Decimal(0),
            installment.installmentAmount.minus(paid),
          ),
        };
      })
      .filter((installment) => installment.remainingAmount.gt(0));

    if (outstanding.length === 0) {
      throw new UnprocessableEntityException(
        'There are no outstanding installments for this enrollment.',
      );
    }

    if (requestedAllocations?.length) {
      const byId = new Map(outstanding.map((i) => [i.id, i]));
      const seen = new Set<string>();
      const allocations: Array<{
        batchInstallmentId: string;
        amount: Prisma.Decimal;
      }> = [];

      for (const item of requestedAllocations) {
        if (seen.has(item.batchInstallmentId)) {
          throw new ConflictException(
            'The same installment cannot appear more than once in allocations.',
          );
        }
        seen.add(item.batchInstallmentId);

        const installment = byId.get(item.batchInstallmentId);
        if (!installment) {
          throw new UnprocessableEntityException(
            `Installment ${item.batchInstallmentId} is not outstanding for this enrollment.`,
          );
        }
        if (item.amount.lte(0) || item.amount.gt(installment.remainingAmount)) {
          throw new UnprocessableEntityException(
            `Allocation for installment ${installment.installmentNumber} must be greater than zero and cannot exceed its outstanding amount.`,
          );
        }
        allocations.push(item);
      }

      const total = allocations.reduce(
        (sum, item) => sum.plus(item.amount),
        new Prisma.Decimal(0),
      );
      if (!total.eq(paymentAmount)) {
        throw new UnprocessableEntityException(
          `Allocation total ${total.toFixed(2)} must equal payment amount ${paymentAmount.toFixed(2)}.`,
        );
      }
      return allocations;
    }

    let remaining = paymentAmount;
    const allocations: Array<{
      batchInstallmentId: string;
      amount: Prisma.Decimal;
    }> = [];
    for (const installment of outstanding) {
      if (remaining.lte(0)) break;
      const allocation = Prisma.Decimal.min(
        remaining,
        installment.remainingAmount,
      );
      if (allocation.gt(0)) {
        allocations.push({
          batchInstallmentId: installment.id,
          amount: allocation,
        });
        remaining = remaining.minus(allocation);
      }
    }

    if (remaining.gt(0)) {
      throw new UnprocessableEntityException(
        'Payment amount exceeds the total outstanding balance for this enrollment.',
      );
    }
    return allocations;
  }

  async reversePayment(id: string, reason: string, userId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id },
          include: { allocations: true },
        });

        if (!payment) return null;
        if (payment.status === PaymentStatus.REVERSED) return payment;

        await tx.payment.update({
          where: { id },
          data: {
            status: PaymentStatus.REVERSED,
            reversalReason: reason,
            reversedAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'PAYMENT_REVERSED',
            entityName: 'Payment',
            entityId: id,
            previousValue: { status: payment.status },
            newValue: { status: PaymentStatus.REVERSED, reason },
            reason,
          },
        });

        return tx.payment.findUniqueOrThrow({
          where: { id },
          include: {
            allocations: { include: { batchInstallment: true } },
            enrollment: {
              include: {
                member: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
                batch: true,
                batchPlan: { include: { planTemplate: true } },
              },
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
