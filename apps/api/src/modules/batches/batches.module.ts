import { Module } from '@nestjs/common';
import { BatchesController } from './batches.controller';
import { BatchesRepository } from './batches.repository';
import { BatchesService } from './batches.service';

@Module({
  controllers: [BatchesController],
  providers: [BatchesService, BatchesRepository],
  exports: [BatchesService, BatchesRepository],
})
export class BatchesModule {}
