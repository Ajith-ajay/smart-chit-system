import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example:
      'If an account exists for this email, a password reset link has been sent.',
  })
  message: string;
}
