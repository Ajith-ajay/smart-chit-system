import { Injectable, NotFoundException } from '@nestjs/common';
import { CancelReceiptDto } from './dto/cancel-receipt.dto';
import { ReceiptsRepository } from './receipts.repository';

@Injectable()
export class ReceiptsService {
  constructor(private readonly repository: ReceiptsRepository) {}

  async findOne(id: string) {
    const receipt = await this.repository.findOne(id);
    if (!receipt)
      throw new NotFoundException(`Receipt with ID ${id} not found`);
    return receipt;
  }

  byPayment(paymentId: string) {
    return this.repository.findByPayment(paymentId);
  }

  cancel(id: string, dto: CancelReceiptDto, userId: string) {
    return this.repository.cancel(id, dto.reason.trim(), userId);
  }

  reissue(id: string, userId: string) {
    return this.repository.reissue(id, userId);
  }
}
