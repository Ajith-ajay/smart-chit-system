import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateMemberDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Phone number must be a valid 10-digit mobile number',
  })
  phone!: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: {
      name: 'Jane Doe',
      relation: 'Spouse',
      phone: '9876543211',
    },
  })
  @IsObject()
  @IsOptional()
  nomineeDetails?: Prisma.InputJsonObject;

  @ApiPropertyOptional({
    example: {
      bankName: 'State Bank of India',
      accountNumber: '12345678901',
      ifscCode: 'SBIN0001234',
    },
  })
  @IsObject()
  @IsOptional()
  bankDetails?: Prisma.InputJsonObject;

  @ApiPropertyOptional({ example: 'Regular customer' })
  @IsString()
  @IsOptional()
  remarks?: string;
}
