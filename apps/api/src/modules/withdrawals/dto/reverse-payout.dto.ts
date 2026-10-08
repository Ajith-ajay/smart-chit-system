import { IsString, MinLength } from 'class-validator';

export class ReversePayoutDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}
