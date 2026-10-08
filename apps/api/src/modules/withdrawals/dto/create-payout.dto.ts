import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePayoutDto {
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;

  @IsDateString()
  payoutDate!: string;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
