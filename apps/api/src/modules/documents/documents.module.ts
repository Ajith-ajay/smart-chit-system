import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { LocalDocumentStorageService } from '@/common/storage/local-document-storage.service';

@Module({
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentsRepository,
    LocalDocumentStorageService,
  ],
  exports: [DocumentsService, LocalDocumentStorageService],
})
export class DocumentsModule {}
