import { Module } from '@nestjs/common';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalsRepository } from './withdrawals.repository';

@Module({
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService, WithdrawalsRepository],
  exports: [WithdrawalsService],
})
export class WithdrawalsModule {}
