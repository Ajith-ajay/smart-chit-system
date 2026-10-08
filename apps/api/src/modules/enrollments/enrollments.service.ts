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
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { CatchUpEnrollmentDto } from './dto/catch-up-enrollment.dto';
import { EnrollmentsRepository } from './enrollments.repository';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly repository: EnrollmentsRepository) {}

  async availableBatches() {
    return this.repository.findAvailableBatches();
  }

  async forMember(memberId: string) {
    const member = await this.repository.findMember(memberId);
    if (!member)
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    return this.repository.findForMember(memberId);
  }

  async create(memberId: string, dto: CreateEnrollmentDto) {
    const context = await this.validateEnrollmentContext(
      memberId,
      dto.batchId,
      dto.batchPlanId,
    );
    if (context.batch.status === BatchStatus.RUNNING) {
      throw new UnprocessableEntityException(
        'This batch is already running. Use the catch-up enrollment endpoint so the required earlier installments are collected before activation.',
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

  async catchUpPreview(memberId: string, batchId: string, batchPlanId: string) {
    const { batch, batchPlan } = await this.validateEnrollmentContext(
      memberId,
      batchId,
      batchPlanId,
    );
    if (batch.status !== BatchStatus.RUNNING) {
      throw new UnprocessableEntityException(
        'Catch-up enrollment is only required for a RUNNING batch.',
      );
    }

    const installments = this.getCatchUpInstallments(
      batchPlan.batchInstallments,
    );
    const total = installments.reduce(
      (sum, item) => sum.plus(item.installmentAmount),
      new Prisma.Decimal(0),
    );

    return {
      memberId,
      batchId,
      batchPlanId,
      batch: { id: batch.id, name: batch.name, status: batch.status },
      plan: {
        id: batchPlan.planTemplate.id,
        name: batchPlan.planTemplate.name,
        totalAmount: batchPlan.planTemplate.totalAmount,
      },
      currentInstallment: installments.at(-1)?.installmentNumber ?? null,
      installments: installments.map((i) => ({
        id: i.id,
        installmentNumber: i.installmentNumber,
        dueDate: i.dueDate,
        amount: i.installmentAmount,
      })),
      catchUpAmount: total,
    };
  }

  async catchUp(memberId: string, dto: CatchUpEnrollmentDto, userId: string) {
    const { batch, batchPlan } = await this.validateEnrollmentContext(
      memberId,
      dto.batchId,
      dto.batchPlanId,
    );
    if (batch.status !== BatchStatus.RUNNING) {
      throw new UnprocessableEntityException(
        'Catch-up enrollment is only available for a RUNNING batch.',
      );
    }

    const installments = this.getCatchUpInstallments(
      batchPlan.batchInstallments,
    );
    if (installments.length === 0) {
      throw new UnprocessableEntityException(
        'No current installment is available for catch-up enrollment.',
      );
    }

    const paymentDate = new Date(dto.paymentDate);
    if (Number.isNaN(paymentDate.getTime()))
      throw new UnprocessableEntityException('Invalid payment date.');

    try {
      return await this.repository.createCatchUpEnrollment({
        memberId,
        batchId: dto.batchId,
        batchPlanId: dto.batchPlanId,
        enrollmentNumber: `ENR-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`,
        remarks: dto.remarks?.trim(),
        paymentMethod: dto.paymentMethod,
        paymentDate,
        referenceNumber: dto.referenceNumber?.trim(),
        userId,
        installments: installments.map((i) => ({
          id: i.id,
          installmentNumber: i.installmentNumber,
          amount: i.installmentAmount,
        })),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'DUPLICATE_ENROLLMENT') {
        throw new ConflictException(
          'This member is already enrolled in this plan for this batch.',
        );
      }
      throw error;
    }
  }

  private async validateEnrollmentContext(
    memberId: string,
    batchId: string,
    batchPlanId: string,
  ) {
    const member = await this.repository.findMember(memberId);
    if (!member)
      throw new NotFoundException(`Member with ID ${memberId} not found`);
    if (member.status !== MemberStatus.ACTIVE)
      throw new UnprocessableEntityException(
        'Only active members can be enrolled',
      );

    const batch = await this.repository.findJoinableBatch(batchId);
    if (!batch) throw new NotFoundException('A joinable batch was not found');
    if (batch.status === BatchStatus.COMPLETED)
      throw new UnprocessableEntityException(
        'Cannot enroll a member into a completed batch.',
      );
    if (batch.status === BatchStatus.CANCELLED)
      throw new UnprocessableEntityException(
        'Cannot enroll a member into a cancelled batch.',
      );

    const batchPlan = await this.repository.findBatchPlan(batchId, batchPlanId);
    if (!batchPlan)
      throw new NotFoundException(
        'The selected chit plan is not configured for this batch',
      );

    if (
      await this.repository.findActiveEnrollment(memberId, batchId, batchPlanId)
    ) {
      throw new ConflictException(
        'This member is already enrolled in this plan for this batch',
      );
    }

    return { member, batch, batchPlan };
  }

  private getCatchUpInstallments(
    installments: Array<{
      id: string;
      installmentNumber: number;
      dueDate: Date;
      installmentAmount: Prisma.Decimal;
      status: BatchInstallmentStatus;
    }>,
  ) {
    const now = new Date();
    const currentInstallmentNumber = installments.reduce(
      (latest, installment) =>
        installment.dueDate <= now
          ? Math.max(latest, installment.installmentNumber)
          : latest,
      0,
    );

    if (currentInstallmentNumber === 0) {
      throw new UnprocessableEntityException(
        'The batch has not reached its first installment date yet.',
      );
    }
    if (currentInstallmentNumber > 3) {
      throw new UnprocessableEntityException(
        'Catch-up enrollment is closed after the third installment.',
      );
    }

    return installments.filter(
      (installment) =>
        installment.installmentNumber <= currentInstallmentNumber,
    );
  }
}
