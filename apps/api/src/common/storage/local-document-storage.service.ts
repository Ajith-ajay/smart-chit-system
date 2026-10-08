import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const EXTENSIONS: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
};

export interface UploadedDocumentFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

@Injectable()
export class LocalDocumentStorageService {
  private readonly rootDirectory = path.resolve(
    process.cwd(),
    process.env.LOCAL_DOCUMENT_STORAGE_DIR ?? 'storage/documents',
  );

  async save(file: UploadedDocumentFile, ownerId: string) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported document type: ${file.mimetype}`,
      );
    }

    if (file.size <= 0 || file.size > 20 * 1024 * 1024) {
      throw new BadRequestException(
        'Document size must be between 1 byte and 20 MB.',
      );
    }

    const extension = EXTENSIONS[file.mimetype];
    const relativeDirectory = path.join('members', ownerId);
    const relativeKey = path.join(
      relativeDirectory,
      `${randomUUID()}${extension}`,
    );
    const absolutePath = path.join(this.rootDirectory, relativeKey);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file.buffer, { flag: 'wx' });

    return {
      fileKey: relativeKey.replaceAll(path.sep, '/'),
      fileSize: file.size,
      mimeType: file.mimetype,
      absolutePath,
    };
  }

  resolve(fileKey: string) {
    const normalized = path.normalize(fileKey).replace(/^([.][.][/\\])+/, '');
    const absolute = path.resolve(this.rootDirectory, normalized);
    if (!absolute.startsWith(`${this.rootDirectory}${path.sep}`)) {
      throw new BadRequestException('Invalid document path.');
    }
    return absolute;
  }

  async delete(fileKey: string) {
    await fs.rm(this.resolve(fileKey), { force: true });
  }
}
