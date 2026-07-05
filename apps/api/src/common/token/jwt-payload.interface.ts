import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti?: string;
  type?: 'access' | 'refresh' | 'password-reset';
}
