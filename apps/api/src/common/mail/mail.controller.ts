import { Controller, HttpCode, HttpStatus, Post, Body } from '@nestjs/common';

import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-mail.dto';

@Controller({
  path: 'mail',
  version: '1',
})
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendMail(@Body() dto: SendMailDto): Promise<void> {
    return this.mailService.send(dto);
  }
}
