import { IsOptional, IsString, Matches } from 'class-validator';

export class ApproveWithdrawalDto {
  @Matches(/^\d+(\.\d{1,2})?$/)
  approvedAmount!: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
