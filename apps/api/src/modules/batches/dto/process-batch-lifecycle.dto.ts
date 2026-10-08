import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ProcessBatchLifecycleDto {
  @ApiPropertyOptional({
    example: '2026-11-10',
    description: 'Process the batch as if it were this date. Defaults to now.',
  })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;
}
