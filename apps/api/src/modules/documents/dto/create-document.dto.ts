import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, KycDocumentType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  type!: DocumentType;

  @ApiProperty({ example: 'Aadhaar Card - Front' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'documents/members/<member-id>/aadhaar-front.pdf' })
  @IsString()
  @MaxLength(500)
  fileKey!: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/...' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  fileUrl?: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @MaxLength(100)
  mimeType!: string;

  @ApiProperty({ example: 245678 })
  @IsInt()
  @Min(1)
  @Max(50_000_000)
  fileSize!: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  memberId?: string;

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
