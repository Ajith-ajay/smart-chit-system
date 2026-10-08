import { FollowUpStatus, FollowUpType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateFollowUpDto {
  @IsOptional()
  @IsUUID()
  batchInstallmentId?: string;

  @IsEnum(FollowUpType)
  type!: FollowUpType;

  @IsEnum(FollowUpStatus)
  status!: FollowUpStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsDateString()
  followUpDate!: string;
}
