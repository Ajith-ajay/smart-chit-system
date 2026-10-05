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
    description: 'Batch installment to allocate this payment against.',
  })
  @IsUUID('4')
  batchInstallmentId!: string;

  @ApiProperty({
    example: '5000.00',
    description: 'Amount allocated to this installment.',
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
      'Optional explicit allocations. If omitted, the system allocates oldest outstanding installments first.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  allocations?: PaymentAllocationDto[];
}
