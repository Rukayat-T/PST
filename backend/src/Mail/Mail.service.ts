import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(): Promise<any> {
    try {
      const message = `Hello, testing!! testing!!`;

      await this.mailerService.sendMail({
        from: 'Project Selection Tool <pst092024@gmail.com>',
        to: 'tewogbaderukayat@gmail.com',
        subject: `How to Send Emails with Nodemailer`,
        text: message,
      });

      return 'sent';
    } catch (error) {
      console.log(error);
      return error;
    }
  }
}
