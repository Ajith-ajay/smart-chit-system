import { PrismaService } from '@/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';

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
      where: {
        id: batchPlanId,
        batchId,
        planTemplate: { isActive: true },
      },
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
        status: {
          not: EnrollmentStatus.CANCELLED,
        },
      },
      select: {
        id: true,
      },
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
      include: {
        batch: true,
        batchPlan: { include: { planTemplate: true } },
      },
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
}
