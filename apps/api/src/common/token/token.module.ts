import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
