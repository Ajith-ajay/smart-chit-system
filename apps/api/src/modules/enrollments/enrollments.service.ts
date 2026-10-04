import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  BatchInstallmentStatus,
  BatchStatus,
  MemberStatus,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentsRepository } from './enrollments.repository';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly repository: EnrollmentsRepository) {}

  async availableBatches() {
    return this.repository.findAvailableBatches();
  }

  async forMember(memberId: string) {
    const member = await this.repository.findMember(memberId);
    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    }
    return this.repository.findForMember(memberId);
  }

  async create(memberId: string, dto: CreateEnrollmentDto) {
    const member = await this.repository.findMember(memberId);
    if (!member) {
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    }
    if (member.status !== MemberStatus.ACTIVE) {
      throw new UnprocessableEntityException(
        'Only active members can be enrolled',
      );
    }

    const batch = await this.repository.findJoinableBatch(dto.batchId);
    if (!batch) {
      throw new NotFoundException('A joinable batch was not found');
    }

    const batchPlan = await this.repository.findBatchPlan(
      dto.batchId,
      dto.batchPlanId,
    );
    if (!batchPlan) {
      throw new NotFoundException(
        'The selected chit plan is not configured for this batch',
      );
    }

    if (batch.status === BatchStatus.COMPLETED) {
      throw new UnprocessableEntityException(
        'Cannot enroll a member into a completed batch.',
      );
    }

    if (batch.status === BatchStatus.CANCELLED) {
      throw new UnprocessableEntityException(
        'Cannot enroll a member into a cancelled batch.',
      );
    }

    if (batch.status === BatchStatus.RUNNING) {
      const completedInstallments = batchPlan.batchInstallments.filter(
        (installment) =>
          installment.status === BatchInstallmentStatus.COMPLETED,
      );

      if (completedInstallments.length >= 2) {
        throw new UnprocessableEntityException(
          'New enrollment is allowed only until two installments have been completed for this batch.',
        );
      }
    }

    if (
      await this.repository.findActiveEnrollment(
        memberId,
        dto.batchId,
        dto.batchPlanId,
      )
    ) {
      throw new ConflictException(
        'This member is already enrolled in this plan for this batch',
      );
    }

    return this.repository.create(
      memberId,
      dto.batchId,
      dto.batchPlanId,
      `ENR-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`,
      dto.remarks,
    );
  }
}
