import { UserRole } from '@prisma/client';

export class UserResponseDto {
  id!: string;

  firstName!: string;

  lastName!: string;

  email!: string;

  role!: UserRole;
}
