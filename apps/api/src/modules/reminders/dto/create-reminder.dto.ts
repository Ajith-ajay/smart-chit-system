import { ReminderType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateReminderDto {
  @IsOptional()
  @IsUUID()
  batchInstallmentId?: string;

  @IsDateString()
  scheduledDate!: string;

  @IsEnum(ReminderType)
  type!: ReminderType;

  @IsString()
  @MaxLength(2000)
  message!: string;
}
