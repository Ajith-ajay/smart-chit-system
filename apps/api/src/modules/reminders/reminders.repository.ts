import { Injectable } from '@nestjs/common';
import { Prisma, ReminderStatus } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class RemindersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEnrollment(id: string) {
    return this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        member: true,
        batch: true,
        batchPlan: { include: { planTemplate: true } },
      },
    });
  }

  findInstallment(id: string) {
    return this.prisma.batchInstallment.findUnique({
      where: { id },
      include: { batch: true, batchPlan: { include: { planTemplate: true } } },
    });
  }

  findReminder(id: string) {
    return this.prisma.reminder.findUnique({
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
      },
    });
  }

  findFollowUp(id: string) {
    return this.prisma.followUp.findUnique({
      where: { id },
      include: {
        member: true,
        enrollment: {
          include: {
            batch: true,
            batchPlan: { include: { planTemplate: true } },
          },
        },
        batchInstallment: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  createReminder(data: Prisma.ReminderUncheckedCreateInput, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reminder = await tx.reminder.create({
        data,
        include: {
          enrollment: { include: { member: true } },
          batchInstallment: true,
        },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'REMINDER_CREATED',
          entityName: 'Reminder',
          entityId: reminder.id,
          newValue: {
            type: reminder.type,
            scheduledDate: reminder.scheduledDate.toISOString(),
            enrollmentId: reminder.enrollmentId,
          },
        },
      });
      return reminder;
    });
  }

  updateReminderStatus(id: string, status: ReminderStatus, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.reminder.findUnique({ where: { id } });
      if (!existing) return null;
      const updated = await tx.reminder.update({
        where: { id },
        data: {
          status,
          sentAt: status === ReminderStatus.SENT ? new Date() : existing.sentAt,
        },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: `REMINDER_${status}`,
          entityName: 'Reminder',
          entityId: id,
          previousValue: { status: existing.status },
          newValue: {
            status: updated.status,
            sentAt: updated.sentAt?.toISOString(),
          },
        },
      });
      return updated;
    });
  }

  listReminders(where: Prisma.ReminderWhereInput) {
    return this.prisma.reminder.findMany({
      where,
      orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'asc' }],
      include: {
        batchInstallment: true,
        enrollment: { include: { member: true, batch: true } },
      },
    });
  }

  createFollowUp(data: Prisma.FollowUpUncheckedCreateInput, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const followUp = await tx.followUp.create({
        data,
        include: { member: true, enrollment: true, batchInstallment: true },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'FOLLOW_UP_CREATED',
          entityName: 'FollowUp',
          entityId: followUp.id,
          newValue: {
            type: followUp.type,
            status: followUp.status,
            enrollmentId: followUp.enrollmentId,
          },
        },
      });
      return followUp;
    });
  }

  listFollowUps(where: Prisma.FollowUpWhereInput) {
    return this.prisma.followUp.findMany({
      where,
      orderBy: [{ followUpDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        member: true,
        batchInstallment: true,
        enrollment: {
          include: {
            batch: true,
            batchPlan: { include: { planTemplate: true } },
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  completeFollowUp(id: string, notes: string | undefined, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.followUp.findUnique({ where: { id } });
      if (!existing) return null;
      const updated = await tx.followUp.update({
        where: { id },
        data: {
          completedAt: new Date(),
          notes: notes?.trim() || existing.notes,
        },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'FOLLOW_UP_COMPLETED',
          entityName: 'FollowUp',
          entityId: id,
          previousValue: { completedAt: existing.completedAt?.toISOString() },
          newValue: {
            completedAt: updated.completedAt?.toISOString(),
            notes: updated.notes,
          },
        },
      });
      return updated;
    });
  }
}
