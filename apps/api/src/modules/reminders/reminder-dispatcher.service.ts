import { PrismaService } from '@/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { ReminderStatus, ReminderType } from '@prisma/client';
import { WhatsAppProvider } from './providers/whatsapp.provider';

type ReminderDispatchResult = {
  id: string;
  status: 'SENT' | 'SKIPPED' | 'FAILED';
  error?: string;
};

@Injectable()
export class ReminderDispatcherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsAppProvider,
  ) {}

  async dispatchDue() {
    const now = new Date();
    const reminders = await this.prisma.reminder.findMany({
      where: {
        status: ReminderStatus.PENDING,
        scheduledDate: { lte: now },
        type: ReminderType.WHATSAPP,
      },
      include: { enrollment: { include: { member: true } } },
      orderBy: { scheduledDate: 'asc' },
      take: 100,
    });

    const results: ReminderDispatchResult[] = [];
    for (const reminder of reminders) {
      try {
        await this.whatsapp.send({
          to: reminder.enrollment.member.phone,
          message: reminder.message,
        });
        const updated = await this.prisma.reminder.updateMany({
          where: { id: reminder.id, status: ReminderStatus.PENDING },
          data: { status: ReminderStatus.SENT, sentAt: new Date() },
        });
        results.push({
          id: reminder.id,
          status: updated.count ? 'SENT' : 'SKIPPED',
        });
      } catch (error) {
        await this.prisma.reminder.updateMany({
          where: { id: reminder.id, status: ReminderStatus.PENDING },
          data: { status: ReminderStatus.FAILED },
        });
        results.push({
          id: reminder.id,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    return results;
  }
}
