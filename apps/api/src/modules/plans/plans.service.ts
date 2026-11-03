import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Plan templates are master data seeded from the approved schedule files.
   * They are intentionally read-only through this showcase API. Batch creation
   * snapshots these values into BatchInstallment records.
   */
  findAll() {
    return this.prisma.planTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ totalAmount: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        totalAmount: true,
        installmentCount: true,
        isActive: true,
        schedules: {
          orderBy: { installmentNumber: 'asc' },
          select: {
            installmentNumber: true,
            installmentAmount: true,
            withdrawalAmount: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.planTemplate.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        totalAmount: true,
        installmentCount: true,
        isActive: true,
        schedules: {
          orderBy: { installmentNumber: 'asc' },
          select: {
            installmentNumber: true,
            installmentAmount: true,
            withdrawalAmount: true,
          },
        },
      },
    });

    if (!plan)
      throw new NotFoundException(
        `Active plan template '${id}' was not found.`,
      );
    return plan;
  }
}
