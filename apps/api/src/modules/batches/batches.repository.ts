import { Injectable } from '@nestjs/common';
import { BatchStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class BatchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.batch.findUnique({
      where: { id },
      include: {
        plans: {
          include: {
            planTemplate: {
              include: { schedules: { orderBy: { installmentNumber: 'asc' } } },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        batchInstallments: {
          orderBy: [{ installmentNumber: 'asc' }],
          include: { batchPlan: { include: { planTemplate: true } } },
        },
        _count: { select: { enrollments: true } },
      },
    });
  }

  findAll(status?: BatchStatus) {
    return this.prisma.batch.findMany({
      where: status ? { status } : undefined,
      orderBy: { startDate: 'desc' },
      include: {
        plans: { include: { planTemplate: true } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  findName(name: string) {
    return this.prisma.batch.findUnique({
      where: { name },
      select: { id: true },
    });
  }

  findActivePlanTemplates(ids: string[]) {
    return this.prisma.planTemplate.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { schedules: { orderBy: { installmentNumber: 'asc' } } },
    });
  }

  create(
    data: {
      name: string;
      startDate: Date;
      remarks?: string;
    },
    plans: Array<{
      planTemplateId: string;
      schedules: Array<{
        installmentNumber: number;
        installmentAmount: Prisma.Decimal;
        withdrawalAmount: Prisma.Decimal;
      }>;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.batch.create({
        data: {
          name: data.name,
          startDate: data.startDate,
          remarks: data.remarks,
        },
      });

      for (const plan of plans) {
        const batchPlan = await tx.batchPlan.create({
          data: {
            batchId: batch.id,
            planTemplateId: plan.planTemplateId,
          },
        });

        await tx.batchInstallment.createMany({
          data: plan.schedules.map((schedule) => ({
            batchId: batch.id,
            batchPlanId: batchPlan.id,
            installmentNumber: schedule.installmentNumber,
            dueDate: addMonths(data.startDate, schedule.installmentNumber - 1),
            installmentAmount: schedule.installmentAmount,
            withdrawalAmount: schedule.withdrawalAmount,
          })),
        });
      }

      return tx.batch.findUniqueOrThrow({
        where: { id: batch.id },
        include: {
          plans: { include: { planTemplate: true } },
          batchInstallments: { orderBy: [{ installmentNumber: 'asc' }] },
        },
      });
    });
  }

  update(id: string, data: Prisma.BatchUpdateInput) {
    return this.prisma.batch.update({ where: { id }, data });
  }

  async addPlanWithBatchStartDate(
    batchId: string,
    planTemplateId: string,
    startDate: Date,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const batchPlan = await tx.batchPlan.create({
        data: { batchId, planTemplateId },
      });
      const template = await tx.planTemplate.findUniqueOrThrow({
        where: { id: planTemplateId },
        include: { schedules: { orderBy: { installmentNumber: 'asc' } } },
      });

      await tx.batchInstallment.createMany({
        data: template.schedules.map((schedule) => ({
          batchId,
          batchPlanId: batchPlan.id,
          installmentNumber: schedule.installmentNumber,
          dueDate: addMonths(startDate, schedule.installmentNumber - 1),
          installmentAmount: schedule.installmentAmount,
          withdrawalAmount: schedule.withdrawalAmount,
        })),
      });

      return batchPlan;
    });
  }

  removePlan(batchId: string, planTemplateId: string) {
    return this.prisma.$transaction(async (tx) => {
      const batchPlan = await tx.batchPlan.findUnique({
        where: { batchId_planTemplateId: { batchId, planTemplateId } },
        include: {
          _count: { select: { enrollments: true, batchInstallments: true } },
        },
      });

      if (!batchPlan) return null;

      await tx.batchInstallment.deleteMany({
        where: { batchPlanId: batchPlan.id },
      });
      await tx.batchPlan.delete({ where: { id: batchPlan.id } });
      return batchPlan;
    });
  }

  start(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.batch.update({
        where: { id },
        data: { status: 'RUNNING' },
      });

      await tx.batchInstallment.updateMany({
        where: { batchId: id, installmentNumber: 1 },
        data: { status: 'ACTIVE' },
      });

      return batch;
    });
  }

  complete(id: string) {
    return this.prisma.batch.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  cancel(id: string) {
    return this.prisma.batch.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  countActiveEnrollments(id: string) {
    return this.prisma.enrollment.count({
      where: { batchId: id, status: 'ACTIVE' },
    });
  }

  countPendingInstallments(id: string) {
    return this.prisma.batchInstallment.count({
      where: { batchId: id, status: { not: 'COMPLETED' } },
    });
  }

  getPlan(id: string, planTemplateId: string) {
    return this.prisma.batchPlan.findUnique({
      where: { batchId_planTemplateId: { batchId: id, planTemplateId } },
      include: {
        planTemplate: true,
        _count: { select: { enrollments: true } },
      },
    });
  }

  countPlans(id: string) {
    return this.prisma.batchPlan.count({ where: { batchId: id } });
  }
}

function addMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const firstOfTargetMonth = new Date(Date.UTC(year, month, 1));
  const targetYear = firstOfTargetMonth.getUTCFullYear();
  const targetMonth = firstOfTargetMonth.getUTCMonth();
  const lastDayOfTargetMonth = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate();

  return new Date(
    Date.UTC(targetYear, targetMonth, Math.min(day, lastDayOfTargetMonth)),
  );
}
