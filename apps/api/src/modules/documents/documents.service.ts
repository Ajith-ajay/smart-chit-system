import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DocumentType, KycStatus } from '@prisma/client';
import { CreateDocumentDto } from './dto/create-document.dto';
import { RejectDocumentDto } from './dto/reject-document.dto';
import { DocumentsRepository } from './documents.repository';
import {
  LocalDocumentStorageService,
  UploadedDocumentFile,
} from '@/common/storage/local-document-storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly repository: DocumentsRepository,
    private readonly storage: LocalDocumentStorageService,
  ) {}

  async create(enrollmentId: string, dto: CreateDocumentDto, userId: string) {
    const enrollment = await this.repository.findEnrollment(enrollmentId);
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found.');
    }

    if (
      enrollment.batch.status === 'COMPLETED' ||
      enrollment.batch.status === 'CANCELLED'
    ) {
      throw new UnprocessableEntityException(
        'Documents cannot be added to a closed batch.',
      );
    }

    if (dto.type === DocumentType.KYC) {
      if (!dto.kycType || !dto.kycNumber) {
        throw new UnprocessableEntityException(
          'KYC type and KYC number are required for KYC documents.',
        );
      }
    } else if (dto.kycType || dto.kycNumber) {
      throw new UnprocessableEntityException(
        'KYC fields can only be supplied for KYC documents.',
      );
    }

    if (dto.memberId && dto.memberId !== enrollment.memberId) {
      throw new ConflictException(
        'Document member does not match the enrollment member.',
      );
    }

    return this.repository.create({
      enrollmentId,
      memberId: enrollment.memberId,
      withdrawalId: dto.withdrawalId,
      paymentId: dto.paymentId,
      name: dto.name.trim(),
      type: dto.type,
      fileKey: dto.fileKey.trim(),
      fileUrl: dto.fileUrl?.trim(),
      mimeType: dto.mimeType.trim(),
      fileSize: dto.fileSize,
      uploadedById: userId,
      kycType: dto.kycType,
      kycNumber: dto.kycNumber?.trim(),
      verificationStatus:
        dto.type === DocumentType.KYC ? KycStatus.PENDING : null,
    });
  }

  async upload(
    enrollmentId: string,
    dto: import('./dto/upload-document.dto').UploadDocumentDto,
    file: UploadedDocumentFile,
    userId: string,
  ) {
    const enrollment = await this.repository.findEnrollment(enrollmentId);
    if (!enrollment) throw new NotFoundException('Enrollment not found.');
    if (
      enrollment.batch.status === 'COMPLETED' ||
      enrollment.batch.status === 'CANCELLED'
    ) {
      throw new UnprocessableEntityException(
        'Documents cannot be uploaded to a closed batch.',
      );
    }
    if (dto.type === DocumentType.KYC && (!dto.kycType || !dto.kycNumber)) {
      throw new UnprocessableEntityException(
        'KYC type and KYC number are required for KYC documents.',
      );
    }
    if (dto.type !== DocumentType.KYC && (dto.kycType || dto.kycNumber)) {
      throw new UnprocessableEntityException(
        'KYC fields can only be supplied for KYC documents.',
      );
    }

    const stored = await this.storage.save(file, enrollment.memberId);
    try {
      return await this.repository.create({
        enrollmentId,
        memberId: enrollment.memberId,
        withdrawalId: dto.withdrawalId,
        paymentId: dto.paymentId,
        name: dto.name.trim(),
        type: dto.type,
        fileKey: stored.fileKey,
        mimeType: stored.mimeType,
        fileSize: stored.fileSize,
        uploadedById: userId,
        kycType: dto.kycType,
        kycNumber: dto.kycNumber?.trim(),
        verificationStatus:
          dto.type === DocumentType.KYC ? KycStatus.PENDING : null,
      });
    } catch (error) {
      await this.storage.delete(stored.fileKey);
      throw error;
    }
  }

  async filePath(id: string) {
    const document = await this.findOne(id);
    return { document, path: this.storage.resolve(document.fileKey) };
  }

  async forEnrollment(enrollmentId: string) {
    const enrollment = await this.repository.findEnrollment(enrollmentId);
    if (!enrollment) throw new NotFoundException('Enrollment not found.');
    return this.repository.forEnrollment(enrollmentId);
  }

  async memberKyc(memberId: string) {
    const member = await this.repository.findMember(memberId);
    if (!member) throw new NotFoundException('Member not found.');
    return this.repository.memberKyc(memberId);
  }

  async findOne(id: string) {
    const document = await this.repository.findOne(id);
    if (!document) throw new NotFoundException('Document not found.');
    return document;
  }

  async verify(id: string, userId: string) {
    const document = await this.findOne(id);
    if (document.type !== DocumentType.KYC) {
      throw new UnprocessableEntityException(
        'Only KYC documents can be verified.',
      );
    }
    if (document.verificationStatus === KycStatus.VERIFIED) {
      throw new ConflictException('KYC document is already verified.');
    }
    return this.repository.setKycStatus(
      id,
      KycStatus.VERIFIED,
      undefined,
      userId,
    );
  }

  async reject(id: string, dto: RejectDocumentDto, userId: string) {
    const document = await this.findOne(id);
    if (document.type !== DocumentType.KYC) {
      throw new UnprocessableEntityException(
        'Only KYC documents can be rejected.',
      );
    }
    if (document.verificationStatus === KycStatus.VERIFIED) {
      throw new ConflictException(
        'A verified KYC document cannot be rejected directly.',
      );
    }
    return this.repository.setKycStatus(
      id,
      KycStatus.REJECTED,
      dto.reason.trim(),
      userId,
    );
  }

  async setKycStatus(
    id: string,
    status: KycStatus,
    reason: string | undefined,
    userId: string,
  ) {
    const document = await this.findOne(id);
    if (document.type !== DocumentType.KYC) {
      throw new UnprocessableEntityException(
        'Only KYC documents have a verification status.',
      );
    }
    if (status === KycStatus.REJECTED && !reason?.trim()) {
      throw new UnprocessableEntityException('A rejection reason is required.');
    }
    if (
      document.verificationStatus === KycStatus.VERIFIED &&
      status !== KycStatus.VERIFIED
    ) {
      throw new ConflictException(
        'Verified KYC documents cannot be downgraded. Upload a new document instead.',
      );
    }
    return this.repository.setKycStatus(id, status, reason?.trim(), userId);
  }
}
