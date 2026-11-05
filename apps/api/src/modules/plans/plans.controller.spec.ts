import { Test, TestingModule } from '@nestjs/testing';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

describe('PlansController', () => {
  let controller: PlansController;
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlansController],
      providers: [{ provide: PlansService, useValue: service }],
    }).compile();
    controller = module.get<PlansController>(PlansController);
  });

  it('delegates plan listing', async () => {
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('delegates plan detail lookup', async () => {
    await controller.findOne('plan-id');
    expect(service.findOne).toHaveBeenCalledWith('plan-id');
  });
});
