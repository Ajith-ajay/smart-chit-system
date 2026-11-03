import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { BatchStatus, Prisma } from '@prisma/client';
import { BatchesRepository } from './batches.repository';
import { AddBatchPlanDto } from './dto/add-batch-plan.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Injectable()
export class BatchesService {
  constructor(private readonly repository: BatchesRepository) {}

  async create(dto: CreateBatchDto) {
    const existing = await this.repository.findName(dto.name.trim());
    if (existing)
      throw new ConflictException(`Batch name '${dto.name}' already exists`);

    const plans = await this.repository.findActivePlanTemplates(
      dto.planTemplateIds,
    );
    if (plans.length !== dto.planTemplateIds.length) {
      throw new UnprocessableEntityException(
        'One or more selected plan templates are missing or inactive.',
      );
    }

    for (const plan of plans) {
      if (plan.installmentCount !== 20 || plan.schedules.length !== 20) {
        throw new UnprocessableEntityException(
          `Plan '${plan.name}' must contain exactly 20 installments before it can be added to a batch.`,
        );
      }
    }

    return this.repository.create(
      {
        name: dto.name.trim(),
        startDate: parseDateOnly(dto.startDate),
        remarks: dto.remarks?.trim(),
      },
      plans.map((plan) => ({
        planTemplateId: plan.id,
        schedules: plan.schedules.map((schedule) => ({
          installmentNumber: schedule.installmentNumber,
          installmentAmount: schedule.installmentAmount,
          withdrawalAmount: schedule.withdrawalAmount,
        })),
      })),
    );
  }

  findAll(status?: BatchStatus) {
    return this.repository.findAll(status);
  }

  findAvailablePlanTemplates() {
    return this.repository.findAvailablePlanTemplates();
  }

  async findOne(id: string) {
    const batch = await this.repository.findById(id);
    if (!batch) throw new NotFoundException(`Batch with ID ${id} not found`);
    return batch;
  }

  async update(id: string, dto: UpdateBatchDto) {
    const batch = await this.findOne(id);
    if (batch.status !== BatchStatus.DRAFT) {
      throw new UnprocessableEntityException(
        'Only DRAFT batches can be edited.',
      );
    }

    if (dto.name && dto.name.trim() !== batch.name) {
      const existing = await this.repository.findName(dto.name.trim());
      if (existing && existing.id !== id) {
        throw new ConflictException(`Batch name '${dto.name}' already exists`);
      }
    }

    const data: Prisma.BatchUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.remarks !== undefined) data.remarks = dto.remarks.trim() || null;

    return this.repository.update(id, data);
  }

  async addPlan(id: string, dto: AddBatchPlanDto) {
    const batch = await this.findOne(id);
    if (batch.status !== BatchStatus.DRAFT) {
      throw new UnprocessableEntityException(
        'Plans can only be added to a DRAFT batch.',
      );
    }

    const plan = await this.repository.findActivePlanTemplates([
      dto.planTemplateId,
    ]);
    if (plan.length !== 1) {
      throw new NotFoundException('Active plan template not found.');
    }
    if (plan[0].installmentCount !== 20 || plan[0].schedules.length !== 20) {
      throw new UnprocessableEntityException(
        'The selected plan must contain exactly 20 installments.',
      );
    }

    if (await this.repository.getPlan(id, dto.planTemplateId)) {
      throw new ConflictException(
        'This plan is already configured for the batch.',
      );
    }

    return this.repository.addPlanWithBatchStartDate(
      id,
      dto.planTemplateId,
      batch.startDate,
    );
  }

  async removePlan(id: string, planTemplateId: string) {
    const batch = await this.findOne(id);
    if (batch.status !== BatchStatus.DRAFT) {
      throw new UnprocessableEntityException(
        'Plans can only be removed from a DRAFT batch.',
      );
    }

    const plan = await this.repository.getPlan(id, planTemplateId);
    if (!plan)
      throw new NotFoundException('Plan is not configured for this batch.');

    if ((await this.repository.countPlans(id)) <= 1) {
      throw new UnprocessableEntityException(
        'A batch must contain at least one plan.',
      );
    }

    if (plan._count.enrollments > 0) {
      throw new UnprocessableEntityException(
        'A plan cannot be removed after members have been enrolled into it.',
      );
    }

    return this.repository.removePlan(id, planTemplateId);
  }

  async start(id: string) {
    const batch = await this.findOne(id);

    if (batch.status !== BatchStatus.DRAFT) {
      throw new UnprocessableEntityException(
        'Only DRAFT batches can be started.',
      );
    }

    if (batch.startDate > new Date()) {
      throw new UnprocessableEntityException(
        `This batch can only be started on or after ${batch.startDate.toISOString().slice(0, 10)}.`,
      );
    }

    if (batch.plans.length === 0) {
      throw new UnprocessableEntityException(
        'A batch must contain at least one plan before it starts.',
      );
    }

    if (batch.plans.some((p) => p.planTemplate.installmentCount !== 20)) {
      throw new UnprocessableEntityException(
        'Every plan in a batch must contain exactly 20 installments.',
      );
    }

    return this.repository.start(id);
  }

  async complete(id: string) {
    const batch = await this.findOne(id);
    if (batch.status !== BatchStatus.RUNNING) {
      throw new UnprocessableEntityException(
        'Only RUNNING batches can be completed.',
      );
    }

    const pendingInstallments =
      await this.repository.countPendingInstallments(id);
    if (pendingInstallments > 0) {
      throw new UnprocessableEntityException(
        'The batch cannot be completed while any installment is not COMPLETED.',
      );
    }

    const activeEnrollments = await this.repository.countActiveEnrollments(id);
    if (activeEnrollments > 0) {
      throw new UnprocessableEntityException(
        'The batch cannot be completed while active enrollments remain. Complete or cancel the enrollments first.',
      );
    }

    return this.repository.complete(id);
  }

  async cancel(id: string) {
    const batch = await this.findOne(id);
    if (
      batch.status === BatchStatus.COMPLETED ||
      batch.status === BatchStatus.CANCELLED
    ) {
      throw new UnprocessableEntityException('This batch is already closed.');
    }

    const activeEnrollments = await this.repository.countActiveEnrollments(id);
    if (activeEnrollments > 0) {
      throw new UnprocessableEntityException(
        'The batch cannot be cancelled while active enrollments remain.',
      );
    }

    return this.repository.cancel(id);
  }
}

function parseDateOnly(value: string): Date {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new UnprocessableEntityException('Invalid batch start date.');
  }
  return date;
}
