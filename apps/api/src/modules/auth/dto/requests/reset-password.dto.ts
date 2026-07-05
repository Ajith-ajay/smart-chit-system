import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Yzg0NjY0MWQ1NjYxMmYwZDAyNjBiNjMiLCJlbWFpbCI6ImR1bW15QGV4YW1wbGUuY29tIiwidHlwZSI6InBhc3N3b3JkLXJlc2V0IiwiaWF0IjoxNzUzNjc1NzcwLCJleHAiOjE3NTM2NzkzNzB9.t7jC3xYcQ_h7pU6jB-kO4e3q8z9sM4w3uR9y2a1cX0E',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'NewPassword@123',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/, {
    message:
      'Password must contain uppercase, lowercase, number and special character.',
  })
  newPassword: string;
}
