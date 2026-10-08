import { Module } from '@nestjs/common';
import { BatchesController } from './batches.controller';
import { BatchesRepository } from './batches.repository';
import { BatchesService } from './batches.service';
import { BatchLifecycleService } from './batch-lifecycle.service';
import { BatchLifecycleRunner } from './batch-lifecycle.runner';
import { RemindersModule } from '@/modules/reminders/reminders.module';

@Module({
  imports: [RemindersModule],
  controllers: [BatchesController],
  providers: [
    BatchesService,
    BatchesRepository,
    BatchLifecycleService,
    BatchLifecycleRunner,
  ],
  exports: [BatchesService, BatchLifecycleService],
})
export class BatchesModule {}
