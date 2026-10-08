import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectDocumentDto {
  @ApiProperty({ example: 'Document image is unclear.' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
