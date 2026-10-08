import { Module } from '@nestjs/common';
import { RemindersController } from './reminders.controller';
import { RemindersRepository } from './reminders.repository';
import { RemindersService } from './reminders.service';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { ReminderDispatcherService } from './reminder-dispatcher.service';

@Module({
  controllers: [RemindersController],
  providers: [
    RemindersService,
    RemindersRepository,
    WhatsAppProvider,
    ReminderDispatcherService,
  ],
  exports: [RemindersService, ReminderDispatcherService],
})
export class RemindersModule {}
