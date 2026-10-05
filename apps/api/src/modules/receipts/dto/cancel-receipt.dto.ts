import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelReceiptDto {
  @ApiProperty({ example: 'Payment was entered incorrectly.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
