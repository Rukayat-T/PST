// First we will create a module in nestjs that would
// be responsible for dealing with mail related services.
import { forwardRef, Module } from '@nestjs/common';
// import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
// import { MailController } from './mail.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './Mail.service';
import { MailController } from './Mail.controller';
import { ProposalService } from 'src/services/ProposalService.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProposalEntity } from 'src/entities/Proposal.entity';
import { StudentProfile } from 'src/entities/StudentProfile.entity';
import { TutorProfile } from 'src/entities/TutorProfile.entity';
import { ModulesEntity } from 'src/entities/Modules';
import { AppModule } from 'src/app.module';

@Module({
  imports: [
    // forwardRef(() => AppModule), 
    // TypeOrmModule.forFeature([ProposalEntity, StudentProfile, TutorProfile, ModulesEntity, Activity]),
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'),
          },
        },
        template: {
          dir: __dirname + '/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  controllers: [MailController],
  exports: [MailService],
})
export class MailModule {}
