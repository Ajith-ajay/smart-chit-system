import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateWithdrawalDto {
  @IsUUID()
  batchInstallmentId!: string;

  @Matches(/^\d+(\.\d{1,2})?$/)
  requestedAmount!: string;

  @IsDateString()
  requestedAt!: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
