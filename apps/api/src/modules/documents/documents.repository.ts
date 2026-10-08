import { Injectable, NotFoundException } from '@nestjs/common';
import { KycStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class DocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEnrollment(id: string) {
    return this.prisma.enrollment.findUnique({
      where: { id },
      include: { member: true, batch: true, batchPlan: true },
    });
  }

  findMember(id: string) {
    return this.prisma.member.findUnique({ where: { id } });
  }

  findOne(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        member: true,
        enrollment: {
          include: {
            batch: true,
            batchPlan: { include: { planTemplate: true } },
          },
        },
        withdrawal: true,
        payment: true,
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        verifiedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  forEnrollment(enrollmentId: string) {
    return this.prisma.document.findMany({
      where: { enrollmentId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        verifiedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  memberKyc(memberId: string) {
    return this.prisma.document.findMany({
      where: {
        memberId,
        type: 'KYC',
      },
      orderBy: [{ kycType: 'asc' }, { createdAt: 'desc' }],
      include: {
        enrollment: {
          select: {
            id: true,
            enrollmentNumber: true,
            batchId: true,
            batchPlanId: true,
          },
        },
        verifiedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  create(data: Prisma.DocumentUncheckedCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      const document = await tx.document.create({
        data,
        include: {
          member: true,
          enrollment: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: data.uploadedById,
          action: 'DOCUMENT_UPLOADED',
          entityName: 'Document',
          entityId: document.id,
          newValue: {
            type: document.type,
            name: document.name,
            memberId: document.memberId,
            enrollmentId: document.enrollmentId,
            kycType: document.kycType,
          },
        },
      });

      return document;
    });
  }

  async setKycStatus(
    id: string,
    status: KycStatus,
    reason: string | undefined,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.document.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Document not found.');

      const updated = await tx.document.update({
        where: { id },
        data: {
          verificationStatus: status,
          verifiedAt: status === KycStatus.VERIFIED ? new Date() : null,
          verifiedById: status === KycStatus.VERIFIED ? userId : null,
          rejectionReason:
            status === KycStatus.REJECTED ? (reason ?? null) : null,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: `KYC_${status}`,
          entityName: 'Document',
          entityId: id,
          previousValue: {
            verificationStatus: existing.verificationStatus,
          },
          newValue: {
            verificationStatus: updated.verificationStatus,
            rejectionReason: updated.rejectionReason,
          },
          reason,
        },
      });

      return updated;
    });
  }
}
