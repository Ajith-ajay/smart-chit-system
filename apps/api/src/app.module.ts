import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AppLoggerModule } from '@/common/logger/logger.module';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { TokenModule } from '@/common/token/token.module';
import { jwtConfig, validate } from '@/config';
import configuration from '@/config/configuration';
import { AuthModule } from '@/modules/auth/auth.module';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { BatchesModule } from '@/modules/batches/batches.module';
import { EnrollmentsModule } from '@/modules/enrollments/enrollments.module';
import { HealthModule } from '@/modules/health/health.module';
import { MembersModule } from '@/modules/members/members.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './common/mail/mail.module';
import { PaymentsModule } from './modules/payments/payments.module';

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
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthRepository],
})
export class AppModule {}
