import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateBatchDto {
  @ApiProperty({ example: 'October 2026 Batch' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({
    example: '2026-10-01',
    description:
      'First installment date. The remaining 19 dates are generated monthly.',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Plan templates available for enrollment in this batch.',
    example: ['8a8c1d1e-1111-4444-8888-123456789abc'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  planTemplateIds!: string[];

  @ApiPropertyOptional({
    example: 'Monthly chit batch started in October 2026.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
