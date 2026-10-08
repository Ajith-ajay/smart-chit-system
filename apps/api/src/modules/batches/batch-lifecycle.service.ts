import { PrismaService } from '@/common/prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  BatchInstallmentStatus,
  BatchStatus,
  EnrollmentStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { ProcessBatchLifecycleDto } from './dto/process-batch-lifecycle.dto';

@Injectable()
export class BatchLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  async process(
    batchId: string,
    dto: ProcessBatchLifecycleDto,
    userId?: string,
  ) {
    const asOf = dto.asOfDate ? new Date(dto.asOfDate) : new Date();
    if (Number.isNaN(asOf.getTime())) {
      throw new UnprocessableEntityException(
        'Invalid lifecycle processing date.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const batch = await tx.batch.findUnique({
          where: { id: batchId },
          include: {
            plans: true,
            batchInstallments: {
              orderBy: [{ batchPlanId: 'asc' }, { installmentNumber: 'asc' }],
            },
          },
        });
        if (!batch) throw new NotFoundException('Batch not found.');
        if (
          batch.status === BatchStatus.CANCELLED ||
          batch.status === BatchStatus.COMPLETED
        ) {
          return {
            batchId,
            status: batch.status,
            changed: false,
            reason: 'Batch is already closed.',
          };
        }

        const changes: Prisma.InputJsonObject[] = [];

        if (batch.status === BatchStatus.DRAFT && batch.startDate <= asOf) {
          await tx.batch.update({
            where: { id: batchId },
            data: { status: BatchStatus.RUNNING },
          });
          await tx.batchInstallment.updateMany({
            where: {
              batchId,
              installmentNumber: 1,
              status: BatchInstallmentStatus.PENDING,
            },
            data: { status: BatchInstallmentStatus.ACTIVE },
          });
          changes.push({ action: 'BATCH_STARTED' });
        }

        const runningBatch = await tx.batch.findUniqueOrThrow({
          where: { id: batchId },
          include: {
            batchInstallments: {
              orderBy: [{ batchPlanId: 'asc' }, { installmentNumber: 'asc' }],
            },
          },
        });
        if (runningBatch.status !== BatchStatus.RUNNING) {
          return {
            batchId,
            status: runningBatch.status,
            changed: changes.length > 0,
            changes,
          };
        }

        // A new installment becomes ACTIVE when its due month arrives. Older installments
        // remain ACTIVE until their own outstanding member balances are fully settled.
        await tx.batchInstallment.updateMany({
          where: {
            batchId,
            dueDate: { lte: asOf },
            status: BatchInstallmentStatus.PENDING,
          },
          data: { status: BatchInstallmentStatus.ACTIVE },
        });

        const installments = await tx.batchInstallment.findMany({
          where: { batchId },
          orderBy: [{ batchPlanId: 'asc' }, { installmentNumber: 'asc' }],
        });

        const currentByPlan = new Map<string, number>();
        for (const installment of installments) {
          if (installment.dueDate <= asOf) {
            currentByPlan.set(
              installment.batchPlanId,
              Math.max(
                currentByPlan.get(installment.batchPlanId) ?? 0,
                installment.installmentNumber,
              ),
            );
          }
        }

        // Once installment 4 is due, the late-enrollment window is closed. From that point,
        // earlier installments may be marked COMPLETED, but only after every non-cancelled
        // enrollment in that plan has fully paid that installment.
        for (const installment of installments) {
          if (installment.status !== BatchInstallmentStatus.ACTIVE) continue;
          const currentNumber = currentByPlan.get(installment.batchPlanId) ?? 0;
          if (
            currentNumber <= 3 ||
            (currentNumber < 20 &&
              installment.installmentNumber >= currentNumber)
          )
            continue;

          const enrollments = await tx.enrollment.findMany({
            where: {
              batchPlanId: installment.batchPlanId,
              status: { not: EnrollmentStatus.CANCELLED },
            },
            select: { id: true },
          });
          if (enrollments.length === 0) continue;

          const paidRows = await tx.paymentAllocation.groupBy({
            by: ['batchInstallmentId'],
            where: {
              batchInstallmentId: installment.id,
              payment: {
                status: { not: PaymentStatus.REVERSED },
                enrollmentId: { in: enrollments.map((e) => e.id) },
              },
            },
            _sum: { amount: true },
          });
          const paid = paidRows[0]?._sum.amount ?? new Prisma.Decimal(0);
          const required = installment.installmentAmount.mul(
            enrollments.length,
          );
          if (paid.gte(required)) {
            await tx.batchInstallment.update({
              where: { id: installment.id },
              data: { status: BatchInstallmentStatus.COMPLETED },
            });
            changes.push({
              installmentId: installment.id,
              installmentNumber: installment.installmentNumber,
              status: 'COMPLETED',
            });
          }
        }

        // Complete an enrollment only when every one of its 20 scheduled installments is fully paid.
        const activeEnrollments = await tx.enrollment.findMany({
          where: { batchId, status: EnrollmentStatus.ACTIVE },
          select: { id: true, batchPlanId: true },
        });
        for (const enrollment of activeEnrollments) {
          const [installmentsForPlan, paidRows] = await Promise.all([
            tx.batchInstallment.findMany({
              where: { batchPlanId: enrollment.batchPlanId },
              select: { id: true, installmentAmount: true },
            }),
            tx.paymentAllocation.groupBy({
              by: ['batchInstallmentId'],
              where: {
                payment: {
                  enrollmentId: enrollment.id,
                  status: { not: PaymentStatus.REVERSED },
                },
              },
              _sum: { amount: true },
            }),
          ]);
          const paidByInstallment = new Map(
            paidRows.map((r) => [
              r.batchInstallmentId,
              r._sum.amount ?? new Prisma.Decimal(0),
            ]),
          );
          const fullyPaid =
            installmentsForPlan.length === 20 &&
            installmentsForPlan.every((i) =>
              (paidByInstallment.get(i.id) ?? new Prisma.Decimal(0)).gte(
                i.installmentAmount,
              ),
            );
          if (fullyPaid) {
            await tx.enrollment.update({
              where: { id: enrollment.id },
              data: { status: EnrollmentStatus.COMPLETED },
            });
            changes.push({ enrollmentId: enrollment.id, status: 'COMPLETED' });
          }
        }

        const remainingInstallments = await tx.batchInstallment.count({
          where: { batchId, status: { not: BatchInstallmentStatus.COMPLETED } },
        });
        const remainingEnrollments = await tx.enrollment.count({
          where: { batchId, status: EnrollmentStatus.ACTIVE },
        });
        const twentiethDue = installments
          .filter((i) => i.installmentNumber === 20)
          .every((i) => i.dueDate <= asOf);

        if (
          twentiethDue &&
          remainingInstallments === 0 &&
          remainingEnrollments === 0
        ) {
          await tx.batch.update({
            where: { id: batchId },
            data: { status: BatchStatus.COMPLETED },
          });
          changes.push({ action: 'BATCH_COMPLETED' });
        }

        if (changes.length && userId) {
          await tx.auditLog.create({
            data: {
              userId,
              action: 'BATCH_LIFECYCLE_PROCESSED',
              entityName: 'Batch',
              entityId: batchId,
              newValue: { asOfDate: asOf.toISOString(), changes },
            },
          });
        }

        const result = await tx.batch.findUniqueOrThrow({
          where: { id: batchId },
          include: {
            batchInstallments: {
              orderBy: [{ batchPlanId: 'asc' }, { installmentNumber: 'asc' }],
            },
            _count: { select: { enrollments: true } },
          },
        });
        return { batch: result, changed: changes.length > 0, changes };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async processAll(asOfDate: Date, userId?: string) {
    const batches = await this.prisma.batch.findMany({
      where: { status: { in: [BatchStatus.DRAFT, BatchStatus.RUNNING] } },
      select: { id: true },
    });
    const results: Awaited<ReturnType<typeof this.process>>[] = [];
    for (const batch of batches) {
      results.push(
        await this.process(
          batch.id,
          { asOfDate: asOfDate.toISOString() },
          userId,
        ),
      );
    }
    return results;
  }
}
