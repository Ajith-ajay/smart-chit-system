import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { UsersModule } from '@/modules/users/users.module';
import configuration from '@/config/configuration';
import { ConfigModule } from '@nestjs/config';
import { validate, jwtConfig } from '@/config';
import { AppLoggerModule } from '@/common/logger/logger.module';
import { HealthModule } from '@/modules/health/health.module';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { TokenModule } from '@/common/token/token.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { MailModule } from './common/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      load: [configuration, jwtConfig],
      validate,
    }),
    PrismaModule,
    UsersModule,
    HealthModule,
    TokenModule,
    AuthModule,
    MailModule,
    AppLoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthRepository],
})
export class AppModule {}
