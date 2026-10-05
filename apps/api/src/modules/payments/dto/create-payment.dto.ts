import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class PaymentAllocationDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Any installment in this enrollment. It may be partially paid and does not have to be the oldest installment; use explicit allocations when intentionally skipping earlier installments.',
  })
  @IsUUID('4')
  batchInstallmentId!: string;

  @ApiProperty({
    example: '5000.00',
    description:
      'Amount to apply to this installment. Multiple separate payments may be allocated to the same installment until its scheduled amount is fully paid.',
  })
  @Transform(({ value }) => String(value))
  @IsDecimal({ decimal_digits: '0,2' })
  amount!: string;
}

export class CreatePaymentDto {
  @ApiProperty({
    example: '5000.00',
    description: 'Total amount collected from the member.',
  })
  @Transform(({ value }) => String(value))
  @IsDecimal({ decimal_digits: '0,2' })
  amount!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  paymentDate!: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @ApiPropertyOptional({
    type: [PaymentAllocationDto],
    description:
      'Optional explicit allocations. Omit for automatic oldest-outstanding allocation. Provide this array when the member intentionally skips an earlier installment, pays a specific installment, or wants a payment split across selected installments. The allocation total must exactly equal the collected amount.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  allocations?: PaymentAllocationDto[];
}
