import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './Auth/Auth.module';
import { UserEntity } from './entities/UserEntity.entity';
import { StudentProfile } from './entities/StudentProfile.entity';
import { TutorProfile } from './entities/TutorProfile.entity';
import { ProjectEntity } from './entities/Project.entity';
import { ProjectController } from './controllers/ProjectController.controller';
import { ProjectService } from './services/ProjectService.service';
import { ChosenProject } from './entities/ChosenProject';
import { ModulesEntity } from './entities/Modules';
import { ProposalEntity } from './entities/Proposal.entity';
import { ProposalController } from './controllers/ProposalController.controller';
import { ProposalService } from './services/ProposalService.service';
import { AuthService } from './Auth/Auth.service';
import { MailModule } from './Mail/Mail.module';
import { TutorDashboardController } from './controllers/TutorDashboardController.controller';
import { TutorDashboardService } from './services/TutorDashboardService.service';
import { Action } from 'rxjs/internal/scheduler/Action';
import { ActivityEntity } from './entities/Activities.entity';
import { AdminInputRequest } from './entities/AdminInputRequest.enity';
import { AdminDashboardController } from './controllers/AdminDashboardController.controller';
import { AdminDashboardService } from './services/AdminDashboardService.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(<string>process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
        // ca: process.env.CERTIFICATE.toString(),
      },
    }),
    // forwardRef(() => MailModule),
    AuthModule,
    MailModule,
    TypeOrmModule.forFeature([
      ProjectEntity,
      ChosenProject,
      ModulesEntity,
      ProposalEntity,
      ActivityEntity,
      AdminInputRequest
    ]),
  ],
  controllers: [
    ProjectController,
    ProposalController,
    AppController,
    TutorDashboardController,
    AdminDashboardController
  ],
  providers: [ProjectService, ProposalService, TutorDashboardService, AdminDashboardService],
  // exports:[ProposalService]
})
export class AppModule {}
