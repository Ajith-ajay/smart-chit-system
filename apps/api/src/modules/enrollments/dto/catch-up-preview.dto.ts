import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CatchUpPreviewDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  batchId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  batchPlanId!: string;
}
