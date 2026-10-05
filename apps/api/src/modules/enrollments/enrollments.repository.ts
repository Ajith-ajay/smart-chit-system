import { PrismaService } from '@/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  EnrollmentStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class EnrollmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMember(id: string) {
    return this.prisma.member.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });
  }

  findJoinableBatch(id: string) {
    return this.prisma.batch.findFirst({
      where: { id, status: { in: ['DRAFT', 'RUNNING'] } },
      include: {
        plans: {
          include: {
            planTemplate: {
              include: { schedules: { orderBy: { installmentNumber: 'asc' } } },
            },
            batchInstallments: { orderBy: { installmentNumber: 'asc' } },
          },
        },
      },
    });
  }

  findBatchPlan(batchId: string, batchPlanId: string) {
    return this.prisma.batchPlan.findFirst({
      where: { id: batchPlanId, batchId, planTemplate: { isActive: true } },
      include: {
        planTemplate: {
          include: { schedules: { orderBy: { installmentNumber: 'asc' } } },
        },
        batch: { select: { id: true, status: true, startDate: true } },
        batchInstallments: { orderBy: { installmentNumber: 'asc' } },
      },
    });
  }

  findActiveEnrollment(memberId: string, batchId: string, batchPlanId: string) {
    return this.prisma.enrollment.findFirst({
      where: {
        memberId,
        batchId,
        batchPlanId,
        status: { not: EnrollmentStatus.CANCELLED },
      },
      select: { id: true },
    });
  }

  create(
    memberId: string,
    batchId: string,
    batchPlanId: string,
    enrollmentNumber: string,
    remarks?: string,
  ) {
    return this.prisma.enrollment.create({
      data: { memberId, batchId, batchPlanId, enrollmentNumber, remarks },
      include: {
        member: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        batch: { include: { plans: { include: { planTemplate: true } } } },
        batchPlan: { include: { planTemplate: true } },
      },
    });
  }

  findForMember(memberId: string) {
    return this.prisma.enrollment.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      include: { batch: true, batchPlan: { include: { planTemplate: true } } },
    });
  }

  findAvailableBatches() {
    return this.prisma.batch.findMany({
      where: { status: { in: ['DRAFT', 'RUNNING'] } },
      orderBy: { startDate: 'asc' },
      include: {
        plans: {
          include: {
            planTemplate: {
              include: { schedules: { orderBy: { installmentNumber: 'asc' } } },
            },
            batchInstallments: { orderBy: { installmentNumber: 'asc' } },
          },
        },
      },
    });
  }

  async createCatchUpEnrollment(args: {
    memberId: string;
    batchId: string;
    batchPlanId: string;
    enrollmentNumber: string;
    remarks?: string;
    paymentMethod: PaymentMethod;
    paymentDate: Date;
    referenceNumber?: string;
    userId: string;
    installments: Array<{
      id: string;
      installmentNumber: number;
      amount: Prisma.Decimal;
    }>;
  }) {
    return this.prisma.$transaction(
      async (tx) => {
        const duplicate = await tx.enrollment.findFirst({
          where: {
            memberId: args.memberId,
            batchId: args.batchId,
            batchPlanId: args.batchPlanId,
            status: { not: EnrollmentStatus.CANCELLED },
          },
          select: { id: true },
        });
        if (duplicate) throw new Error('DUPLICATE_ENROLLMENT');

        const total = args.installments.reduce(
          (sum, installment) => sum.plus(installment.amount),
          new Prisma.Decimal(0),
        );

        const enrollment = await tx.enrollment.create({
          data: {
            memberId: args.memberId,
            batchId: args.batchId,
            batchPlanId: args.batchPlanId,
            enrollmentNumber: args.enrollmentNumber,
            remarks: args.remarks,
          },
        });

        const payment = await tx.payment.create({
          data: {
            enrollmentId: enrollment.id,
            amount: total,
            paymentDate: args.paymentDate,
            paymentMethod: args.paymentMethod,
            referenceNumber: args.referenceNumber,
            remarks: 'Catch-up payment collected at enrollment.',
            status: PaymentStatus.FULLY_ALLOCATED,
            createdById: args.userId,
          },
        });

        await tx.paymentAllocation.createMany({
          data: args.installments.map((installment) => ({
            paymentId: payment.id,
            batchInstallmentId: installment.id,
            amount: installment.amount,
          })),
        });

        await tx.auditLog.create({
          data: {
            userId: args.userId,
            action: 'CATCH_UP_ENROLLMENT_CREATED',
            entityName: 'Enrollment',
            entityId: enrollment.id,
            newValue: {
              memberId: args.memberId,
              batchId: args.batchId,
              batchPlanId: args.batchPlanId,
              enrollmentNumber: args.enrollmentNumber,
              catchUpAmount: total.toFixed(2),
              installments: args.installments.map((i) => ({
                batchInstallmentId: i.id,
                installmentNumber: i.installmentNumber,
                amount: i.amount.toFixed(2),
              })),
              paymentId: payment.id,
            },
          },
        });

        return tx.enrollment.findUniqueOrThrow({
          where: { id: enrollment.id },
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
            payments: {
              include: { allocations: { include: { batchInstallment: true } } },
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
