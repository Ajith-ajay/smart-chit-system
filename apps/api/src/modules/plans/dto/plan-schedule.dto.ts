import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

export class PlanScheduleDto {
  @ApiProperty({ example: 1, minimum: 1, maximum: 20 })
  @IsInt()
  @Min(1)
  @Max(20)
  installmentNumber!: number;

  @ApiProperty({ example: '2500.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  installmentAmount!: string;

  @ApiProperty({ example: '25000.00' })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  withdrawalAmount!: string;
}
