import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethod } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const repository = {
    findEnrollment: jest.fn(),
    createPayment: jest.fn(),
    findEnrollmentPayments: jest.fn(),
    findPayment: jest.fn(),
    reversePayment: jest.fn(),
    getEnrollmentSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PaymentsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(PaymentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject payment for a missing enrollment', async () => {
    repository.findEnrollment.mockResolvedValue(null);

    await expect(
      service.create(
        '00000000-0000-4000-8000-000000000000',
        {
          amount: '5000.00',
          paymentDate: '2026-10-04T00:00:00.000Z',
          paymentMethod: PaymentMethod.CASH,
        },
        '00000000-0000-4000-8000-000000000001',
      ),
    ).rejects.toThrow('Enrollment with ID');
  });
});
