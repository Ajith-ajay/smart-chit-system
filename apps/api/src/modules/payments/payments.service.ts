import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReversePaymentDto } from './dto/reverse-payment.dto';
import { PaymentsRepository } from './payments.repository';

@Injectable()
export class PaymentsService {
  constructor(private readonly repository: PaymentsRepository) {}

  async create(enrollmentId: string, dto: CreatePaymentDto, userId: string) {
    const enrollment = await this.repository.findEnrollment(enrollmentId);
    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }
    if (enrollment.status !== 'ACTIVE') {
      throw new UnprocessableEntityException(
        'Payments can only be collected for active enrollments.',
      );
    }
    if (
      enrollment.batch.status === 'COMPLETED' ||
      enrollment.batch.status === 'CANCELLED'
    ) {
      throw new UnprocessableEntityException(
        'Payments cannot be collected for a closed batch.',
      );
    }

    const amount = toPositiveDecimal(dto.amount);
    const paymentDate = new Date(dto.paymentDate);
    if (Number.isNaN(paymentDate.getTime())) {
      throw new UnprocessableEntityException('Invalid payment date.');
    }

    return this.repository.createPayment({
      enrollmentId,
      amount,
      paymentDate,
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.referenceNumber?.trim(),
      remarks: dto.remarks?.trim(),
      createdById: userId,
      requestedAllocations: dto.allocations?.map((allocation) => ({
        batchInstallmentId: allocation.batchInstallmentId,
        amount: toPositiveDecimal(allocation.amount),
      })),
    });
  }

  async summary(enrollmentId: string) {
    const summary = await this.repository.getEnrollmentSummary(enrollmentId);
    if (!summary) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }
    return summary;
  }

  async forEnrollment(enrollmentId: string) {
    const enrollment = await this.repository.findEnrollment(enrollmentId);
    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }
    return this.repository.findEnrollmentPayments(enrollmentId);
  }

  async findOne(id: string) {
    const payment = await this.repository.findPayment(id);
    if (!payment)
      throw new NotFoundException(`Payment with ID ${id} not found`);
    return payment;
  }

  async reverse(id: string, dto: ReversePaymentDto, userId: string) {
    const payment = await this.repository.findPayment(id);
    if (!payment)
      throw new NotFoundException(`Payment with ID ${id} not found`);
    if (payment.status === 'REVERSED') {
      throw new ConflictException('Payment is already reversed.');
    }
    return this.repository.reversePayment(id, dto.reason.trim(), userId);
  }
}

function toPositiveDecimal(value: string): Prisma.Decimal {
  const decimal = new Prisma.Decimal(value);
  if (!decimal.isFinite() || decimal.lte(0)) {
    throw new UnprocessableEntityException(
      'Payment amounts must be greater than zero.',
    );
  }
  return decimal;
}
