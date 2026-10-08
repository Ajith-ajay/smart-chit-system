import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, KycDocumentType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  type!: DocumentType;

  @ApiProperty({ example: 'Aadhaar Card - Front' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  withdrawalId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  paymentId?: string;

  @ApiPropertyOptional({ enum: KycDocumentType })
  @IsOptional()
  @IsEnum(KycDocumentType)
  kycType?: KycDocumentType;

  @ApiPropertyOptional({ example: 'XXXX-XXXX-1234' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  kycNumber?: string;
}
