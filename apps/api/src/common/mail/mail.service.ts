import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

import { MailOptions } from './interfaces/mail-options.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async send(options: MailOptions): Promise<void> {
    try {
      const info = (await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context,
      })) as { messageId: string };

      this.logger.log(`Mail sent to ${options.to}`);
      this.logger.log(`Mail sent: ${info.messageId}`);
      console.log(info);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
