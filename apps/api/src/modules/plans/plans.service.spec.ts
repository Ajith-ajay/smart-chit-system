import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PlansService } from './plans.service';

describe('PlansService', () => {
  let service: PlansService;
  const prisma = {
    planTemplate: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlansService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<PlansService>(PlansService);
  });

  it('returns active plans with ordered schedules', async () => {
    const plans = [{ id: 'plan-id', name: 'Test plan', schedules: [] }];
    prisma.planTemplate.findMany.mockResolvedValue(plans);

    await expect(service.findAll()).resolves.toEqual(plans);
    expect(prisma.planTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
        orderBy: [{ totalAmount: 'asc' }, { name: 'asc' }],
      }),
    );
  });

  it('returns one active plan', async () => {
    const plan = { id: 'plan-id', name: 'Test plan', schedules: [] };
    prisma.planTemplate.findFirst.mockResolvedValue(plan);
    await expect(service.findOne('plan-id')).resolves.toEqual(plan);
  });

  it('throws when the requested plan is missing or inactive', async () => {
    prisma.planTemplate.findFirst.mockResolvedValue(null);
    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
