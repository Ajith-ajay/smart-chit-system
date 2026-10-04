import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBatchDto {
  @ApiPropertyOptional({ example: 'October 2026 Batch - Updated' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated remarks' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
