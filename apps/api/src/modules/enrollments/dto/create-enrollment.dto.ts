import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ format: 'uuid', description: 'The batch to join' })
  @IsUUID('4')
  batchId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'The plan configured inside the selected batch.',
  })
  @IsUUID('4')
  batchPlanId!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
