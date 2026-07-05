import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  singleLine: false,
                  colorize: true,
                  translateTime: 'SYS:standard',
                },
              },
      },
    }),
  ],
  exports: [LoggerModule],
})
export class AppLoggerModule {}
