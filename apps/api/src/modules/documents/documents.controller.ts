import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KycStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import type { AuthenticatedUser } from '@/modules/auth/interfaces/authenticated-user.interface';
import { CreateDocumentDto } from './dto/create-document.dto';
import { RejectDocumentDto } from './dto/reject-document.dto';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

@ApiTags('Documents & KYC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE)
@Controller({ path: 'documents', version: '1' })
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post('enrollments/:enrollmentId')
  @ApiOperation({ summary: 'Register a document against an enrollment' })
  create(
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(enrollmentId, dto, user.id);
  }

  @Post('enrollments/:enrollmentId/upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload and store a document locally' })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string,
    @UploadedFile()
    file: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('A document file is required.');
    }
    return this.service.upload(enrollmentId, dto, file, user.id);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Download a locally stored document' })
  async file(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() response: Response,
  ) {
    const { document, path } = await this.service.filePath(id);
    response.setHeader('Content-Type', document.mimeType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(document.name)}"`,
    );
    return response.sendFile(path);
  }

  @Get('enrollments/:enrollmentId')
  @ApiOperation({ summary: 'List documents for an enrollment' })
  list(@Param('enrollmentId', new ParseUUIDPipe()) enrollmentId: string) {
    return this.service.forEnrollment(enrollmentId);
  }

  @Get('members/:memberId/kyc')
  @ApiOperation({ summary: 'List KYC documents for a member' })
  kyc(@Param('memberId', new ParseUUIDPipe()) memberId: string) {
    return this.service.memberKyc(memberId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/verify')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Verify a KYC document' })
  verify(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.verify(id, user.id);
  }

  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject a KYC document' })
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectDocumentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reject(id, dto, user.id);
  }

  @Patch(':id/kyc-status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Set KYC verification status explicitly' })
  setKycStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { status: KycStatus; reason?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.setKycStatus(id, body.status, body.reason, user.id);
  }
}
