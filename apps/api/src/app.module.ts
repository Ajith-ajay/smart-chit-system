import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import configuration from '@/config/configuration';
import { ConfigModule } from '@nestjs/config';
import { validate, jwtConfig } from '@/config';
import { AppLoggerModule } from '@/common/logger/logger.module';
import { HealthModule } from '@/modules/health/health.module';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { TokenModule } from '@/common/token/token.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { MailModule } from './common/mail/mail.module';
import { MembersModule } from '@/modules/members/members.module';
import { EnrollmentsModule } from '@/modules/enrollments/enrollments.module';
import { BatchesModule } from '@/modules/batches/batches.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      load: [configuration, jwtConfig],
      validate,
    }),
    PrismaModule,
    HealthModule,
    TokenModule,
    AuthModule,
    MailModule,
    AppLoggerModule,
    MembersModule,
    EnrollmentsModule,
    BatchesModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthRepository],
})
export class AppModule {}
