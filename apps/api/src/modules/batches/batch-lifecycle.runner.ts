import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BatchLifecycleService } from './batch-lifecycle.service';
import { ReminderDispatcherService } from '../reminders/reminder-dispatcher.service';

@Injectable()
export class BatchLifecycleRunner implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly lifecycle: BatchLifecycleService,
    private readonly reminders: ReminderDispatcherService,
  ) {}

  onModuleInit() {
    if (process.env.BATCH_AUTOMATION_ENABLED !== 'true') return;
    const minutes = Number(process.env.BATCH_AUTOMATION_INTERVAL_MINUTES ?? 60);
    const intervalMs =
      Math.max(5, Number.isFinite(minutes) ? minutes : 60) * 60_000;
    this.timer = setInterval(() => void this.run(), intervalMs);
    void this.run();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async run() {
    await this.lifecycle.processAll(new Date());
    if (process.env.WHATSAPP_AUTOMATION_ENABLED === 'true') {
      await this.reminders.dispatchDue();
    }
  }
}
