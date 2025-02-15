import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/Auth/Auth.service';
import { ChooseProjectDto } from 'src/DTOs/ChooseprojectDto.dto';
import { CreateProjectDto } from 'src/DTOs/CreateProject.dto';
import { EditProjectDto } from 'src/DTOs/EditProjectDto.dto';
import { ChosenProject } from 'src/entities/ChosenProject';
import { ModulesEntity } from 'src/entities/Modules';
import { ProjectEntity } from 'src/entities/Project.entity';
import { ProposalEntity } from 'src/entities/Proposal.entity';
import { StudentProfile } from 'src/entities/StudentProfile.entity';
import { TutorProfile } from 'src/entities/TutorProfile.entity';
import { BaseResponse } from 'src/Responses/BaseResponse';
import { ProjectStatus } from 'src/util/ProjectStatus.enum';
import { Brackets, Repository } from 'typeorm';

@Injectable()
export class TutorDashboardService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(TutorProfile)
    private readonly tutorProfileRepository: Repository<TutorProfile>,
    @InjectRepository(ChosenProject)
    private readonly chosenProjectRepository: Repository<ChosenProject>,
    @InjectRepository(ModulesEntity)
    private readonly modulesRepository: Repository<ModulesEntity>,
    @InjectRepository(ProposalEntity)
    private readonly proposalRepository: Repository<ProposalEntity>,

    private readonly authService: AuthService,
  ) {}

  async template(): Promise<BaseResponse> {
    try {
      return {
        status: 201,
        message: 'successful',
        response: '',
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  //   get cards at top: count active projects, count student applications,
  //  count project proposals, count assigned projects
  /*
return {
    status: 200,
    message: "successful",
    response: {
        activeProjects: 0,
        studentApplications: 0,
        projectProposals: 0,
        assignedProjects: 0
    }
}
*/
  async getMetrics(id: number): Promise<BaseResponse> {
    try {
      const tutor = (await this.authService.getTutor(id)).response;
      if (!tutor) {
        return {
          status: 404,
          message: 'tutor not found',
        };
      }

      const actProjects = await this.projectRepository.find({
        where: {
          //   status: ProjectStatus.ACTIVE,
          tutor: { id },
        },
        relations: ['tutor', 'chosenProjects'],
      });

      let countApps = 0;
      for (const app of actProjects) {
        countApps += app.chosenProjects.length;
      }

      const proposals = await this.proposalRepository.find({
        where: { tutor: { id: id } },
      });

      const allAssignedProjects = await this.projectRepository.find({
        where: {
          status: ProjectStatus.ASSIGNED,
          tutor: { id },
        },
        relations: ['tutor'],
      });

      const activeProjects = actProjects.length;
      const studentApplicatons = countApps;
      const projectProposals = proposals.length;
      const assignedProjects = allAssignedProjects.length;

      return {
        status: 200,
        message: 'successful',
        response: {
          activeProjects: activeProjects,
          studentApplications: studentApplicatons,
          projectProposals: projectProposals,
          assignedProjects: assignedProjects,
        },
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // get graphs

  //get recent activity

  // get popular projects
}
