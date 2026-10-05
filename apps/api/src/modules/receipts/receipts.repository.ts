import { PrismaService } from '@/common/prisma/prisma.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReceiptStatus } from '@prisma/client';

@Injectable()
export class ReceiptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOne(id: string) {
    return this.prisma.receipt.findUnique({
      where: { id },
      include: {
        payment: {
          include: {
            enrollment: {
              include: {
                member: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
                batch: true,
                batchPlan: { include: { planTemplate: true } },
              },
            },
            allocations: {
              include: { batchInstallment: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  findByPayment(paymentId: string) {
    return this.prisma.receipt.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async cancel(id: string, reason: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.findUnique({ where: { id } });
      if (!receipt)
        throw new NotFoundException(`Receipt with ID ${id} not found`);
      if (receipt.status === ReceiptStatus.CANCELLED) {
        throw new ConflictException('Receipt is already cancelled.');
      }

      const updated = await tx.receipt.update({
        where: { id },
        data: { status: ReceiptStatus.CANCELLED },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'RECEIPT_CANCELLED',
          entityName: 'Receipt',
          entityId: id,
          previousValue: {
            status: receipt.status,
            receiptNumber: receipt.receiptNumber,
          },
          newValue: { status: ReceiptStatus.CANCELLED },
          reason,
        },
      });

      return updated;
    });
  }

  async reissue(id: string, userId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const oldReceipt = await tx.receipt.findUnique({
          where: { id },
          include: { payment: true },
        });
        if (!oldReceipt)
          throw new NotFoundException(`Receipt with ID ${id} not found`);
        if (!oldReceipt.paymentId || !oldReceipt.payment) {
          throw new ConflictException('Only payment receipts can be reissued.');
        }
        if (oldReceipt.status !== ReceiptStatus.CANCELLED) {
          throw new ConflictException(
            'The existing receipt must be cancelled before reissue.',
          );
        }
        if (oldReceipt.payment.status === 'REVERSED') {
          throw new ConflictException(
            'A receipt for a reversed payment cannot be reissued.',
          );
        }

        const activeReceipt = await tx.receipt.findFirst({
          where: {
            paymentId: oldReceipt.paymentId,
            status: ReceiptStatus.ACTIVE,
          },
          select: { id: true },
        });
        if (activeReceipt) {
          throw new ConflictException(
            'This payment already has an active receipt.',
          );
        }

        const receiptNumber = await nextReceiptNumber(tx);
        const receipt = await tx.receipt.create({
          data: {
            receiptNumber,
            paymentId: oldReceipt.paymentId,
            status: ReceiptStatus.ACTIVE,
            createdById: userId,
          },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'RECEIPT_REISSUED',
            entityName: 'Receipt',
            entityId: receipt.id,
            previousValue: {
              replacedReceiptId: oldReceipt.id,
              receiptNumber: oldReceipt.receiptNumber,
            },
            newValue: { receiptNumber: receipt.receiptNumber },
          },
        });

        return tx.receipt.findUniqueOrThrow({
          where: { id: receipt.id },
          include: {
            payment: {
              include: { allocations: { include: { batchInstallment: true } } },
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}

export async function nextReceiptNumber(tx: Prisma.TransactionClient) {
  const setting = await tx.systemSettings.findUnique({
    where: { key: 'receipt_prefix' },
  });
  const prefix = setting?.value?.trim() || 'RCT';

  const rows = await tx.$queryRaw<Array<{ value: string }>>`
    UPDATE system_settings
    SET value = (CAST(value AS BIGINT) + 1)::TEXT,
        updated_at = NOW()
    WHERE key = 'receipt_sequence'
    RETURNING value
  `;

  if (rows.length !== 1) {
    throw new Error(
      'Receipt sequence setting is missing. Run the latest Prisma migration.',
    );
  }

  const sequence = BigInt(rows[0].value);
  return `${prefix}-${sequence.toString().padStart(8, '0')}`;
}
