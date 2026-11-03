import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly planSelect = {
    id: true,
    name: true,
    totalAmount: true,
    installmentCount: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    schedules: {
      orderBy: { installmentNumber: 'asc' as const },
      select: {
        id: true,
        installmentNumber: true,
        installmentAmount: true,
        withdrawalAmount: true,
      },
    },
  };

  private validateSchedules(
    schedules: {
      installmentNumber: number;
      installmentAmount: string;
      withdrawalAmount: string;
    }[],
  ) {
    if (schedules.length !== 20) {
      throw new UnprocessableEntityException(
        'A plan must contain exactly 20 installments.',
      );
    }

    const ordered = [...schedules].sort(
      (a, b) => a.installmentNumber - b.installmentNumber,
    );

    ordered.forEach((schedule, index) => {
      if (schedule.installmentNumber !== index + 1) {
        throw new UnprocessableEntityException(
          'Installment numbers must be sequential from 1 to 20.',
        );
      }

      if (
        Number(schedule.installmentAmount) <= 0 ||
        Number(schedule.withdrawalAmount) <= 0
      ) {
        throw new UnprocessableEntityException(
          'Installment and withdrawal amounts must be greater than zero.',
        );
      }
    });

    return ordered;
  }

  async findAll() {
    return this.prisma.planTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ totalAmount: 'asc' }, { name: 'asc' }],
      select: this.planSelect,
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.planTemplate.findFirst({
      where: { id, isActive: true },
      select: this.planSelect,
    });

    if (!plan) {
      throw new NotFoundException('Active plan template not found.');
    }

    return plan;
  }

  async create(dto: CreatePlanDto) {
    const name = dto.name.trim();

    const existing = await this.prisma.planTemplate.findUnique({
      where: { name },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(`A plan named '${name}' already exists.`);
    }

    const schedules = this.validateSchedules(dto.schedules);

    try {
      return await this.prisma.planTemplate.create({
        data: {
          name,
          totalAmount: dto.totalAmount,
          installmentCount: 20,
          schedules: {
            create: schedules.map((schedule) => ({
              installmentNumber: schedule.installmentNumber,
              installmentAmount: schedule.installmentAmount,
              withdrawalAmount: schedule.withdrawalAmount,
            })),
          },
        },
        select: this.planSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A plan with this name already exists.');
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdatePlanDto) {
    const existing = await this.prisma.planTemplate.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        _count: {
          select: { batches: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Active plan template not found.');
    }

    if (existing._count.batches > 0) {
      throw new UnprocessableEntityException(
        'This plan is already associated with a batch. Its details and schedule cannot be modified.',
      );
    }

    if (dto.schedules !== undefined) {
      this.validateSchedules(dto.schedules);
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      const duplicate = await this.prisma.planTemplate.findUnique({
        where: { name },
        select: { id: true },
      });

      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`A plan named '${name}' already exists.`);
      }
    }

    const data: Prisma.PlanTemplateUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.totalAmount !== undefined) {
      data.totalAmount = dto.totalAmount;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.planTemplate.update({
          where: { id },
          data,
        });

        if (dto.schedules !== undefined) {
          await tx.planScheduleTemplate.deleteMany({
            where: { planTemplateId: id },
          });

          await tx.planScheduleTemplate.createMany({
            data: this.validateSchedules(dto.schedules).map((schedule) => ({
              planTemplateId: id,
              installmentNumber: schedule.installmentNumber,
              installmentAmount: schedule.installmentAmount,
              withdrawalAmount: schedule.withdrawalAmount,
            })),
          });
        }

        return tx.planTemplate.findUniqueOrThrow({
          where: { id },
          select: this.planSelect,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A plan with this name already exists.');
      }

      throw error;
    }
  }

  async remove(id: string) {
    const plan = await this.prisma.planTemplate.findFirst({
      where: { id, isActive: true },
      select: { id: true },
    });

    if (!plan) {
      throw new NotFoundException('Active plan template not found.');
    }

    // Soft delete: preserve historical references and financial records.
    return this.prisma.planTemplate.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });
  }
}
