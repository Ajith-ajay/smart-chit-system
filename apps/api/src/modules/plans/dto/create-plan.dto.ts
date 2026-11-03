import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanScheduleDto } from './plan-schedule.dto';

export class CreatePlanDto {
  @ApiProperty({ example: '₹50,000 Plan' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: '50000.00' })
  @IsString()
  @Matches(/^[1-9]\d*(\.\d{1,2})?$/)
  totalAmount!: string;

  @ApiProperty({
    type: [PlanScheduleDto],
    description: 'Exactly 20 installment schedules',
  })
  @IsArray()
  @ArrayMinSize(20)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PlanScheduleDto)
  schedules!: PlanScheduleDto[];
}
