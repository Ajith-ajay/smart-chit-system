import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddBatchPlanDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Plan template to make available in the batch.',
  })
  @IsUUID('4')
  planTemplateId!: string;
}
