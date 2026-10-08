import { KycStatus, DocumentType } from '@prisma/client';
import { UnprocessableEntityException } from '@nestjs/common';
import { DocumentsRepository } from './documents.repository';
import { LocalDocumentStorageService } from '@/common/storage/local-document-storage.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  const repository = {
    findEnrollment: jest.fn(),
    findMember: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    forEnrollment: jest.fn(),
    memberKyc: jest.fn(),
    setKycStatus: jest.fn(),
  };

  const storage = {
    save: jest.fn(),
    delete: jest.fn(),
    resolve: jest.fn(),
  };

  let service: DocumentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DocumentsService(
      repository as unknown as DocumentsRepository,
      storage as unknown as LocalDocumentStorageService,
    );
  });

  it('requires KYC metadata for KYC documents', async () => {
    repository.findEnrollment.mockResolvedValue({
      memberId: 'member-1',
      batch: { status: 'RUNNING' },
    });

    await expect(
      service.create(
        'enrollment-1',
        {
          type: DocumentType.KYC,
          name: 'Aadhaar',
          fileKey: 'key',
          mimeType: 'application/pdf',
          fileSize: 100,
        } satisfies CreateDocumentDto,
        'user-1',
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('does not allow downgrading a verified KYC document', async () => {
    repository.findOne.mockResolvedValue({
      id: 'doc-1',
      type: DocumentType.KYC,
      verificationStatus: KycStatus.VERIFIED,
    });

    await expect(
      service.setKycStatus('doc-1', KycStatus.REJECTED, 'bad', 'user-1'),
    ).rejects.toBeInstanceOf(Error);

    expect(repository.setKycStatus).not.toHaveBeenCalled();
  });
});
