import { UserResponseDto } from './user.response.dto';

export class SignupResponseDto {
  message!: string;

  accessToken!: string;

  refreshToken!: string;

  user!: UserResponseDto;
}
