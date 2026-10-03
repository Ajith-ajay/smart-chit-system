import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';

@Global()
@Module({
  imports: [
    ConfigModule,

    JwtModule.registerAsync({
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.accessSecret'),

        signOptions: {
          expiresIn: config.getOrThrow('jwt.accessExpiresIn'),
        },
      }),
    }),
  ],

  providers: [TokenService],

  exports: [TokenService],
})
export class TokenModule {}
