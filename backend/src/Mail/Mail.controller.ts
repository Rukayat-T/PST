import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MailService } from './Mail.service';

@ApiTags('Mail Controller')
@Controller('Mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}
  @Get("test")
  getHello(): Promise<any> {
    return this.mailService.sendMail();
  }
}
