import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteFollowUpDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
