import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailService } from '@/common/mail/mail.service';
import { PasswordService } from '@/common/security/password.service';
import { SecurityModule } from '@/common/security/security.module';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    SecurityModule,
  ],

  providers: [
    AuthService,
    AuthRepository,
    JwtStrategy,
    MailService,
    PasswordService,
  ],

  controllers: [AuthController],
})
export class AuthModule {}
