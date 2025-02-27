import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MailService } from './Mail/Mail.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('test')
@Controller('test')
export class AppController {
//   constructor(private readonly mailService: MailService) {}
//   @Get()
//   getHello(): Promise<any> {
//     return this.mailService.sendMail();
  // }
}
