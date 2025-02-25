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
import { addDays } from 'date-fns';
import { ActivityEntity } from 'src/entities/Activities.entity';

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
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: Repository<ActivityEntity>,

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

  //get recent activity
  async getRecentActivities(tutorId: number): Promise<BaseResponse> {
    try {
      const activities = await this.activityRepository.find({
        where: {
          tutor : {id: tutorId}
        },
        relations : ['project', 'proposal', 'student'],
        order: {createdAt: 'DESC'},
        take: 6
      })
      
      return {
        status: 201,
        message: 'successful',
        response: activities,
      };
    } catch (error) {
      console.log(error)
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // get popular projects
  async getPopularProjects(id: number): Promise<BaseResponse> {
    try {
      const oneWeekAgo = addDays(new Date(), -7); // Date 7 days ago

      const projects = await this.projectRepository.find({
        where: {
          //   status: ProjectStatus.ACTIVE,
          tutor: { id },
        },
        relations: ['chosenProjects'],
      });

      const projectsWithApplications = projects.map((project) => {
        const allApplications = project.chosenProjects.length;
        const applicationsLastWeek = project.chosenProjects.filter(
          (chosenProject) => new Date(chosenProject.createdAt) > oneWeekAgo,
        ).length;

        return {
          projectId: project.id,
          projectTitle: project.title,
          popularity: allApplications,
          applicationsLastWeek,
        };
      });

      const top5Projects = projectsWithApplications
        .sort((a, b) => b.popularity - a.popularity) // Sort by popularity (descending)
        .slice(0, 5); // Get top 5 projects

      if (top5Projects.length === 0) {
        return {
          status: 404,
          message: 'No popular projects found for this tutor.',
        };
      }

      return {
        status: 201,
        message: 'successful',
        response: top5Projects,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  async getProjectStatusDistribution(id: number): Promise<BaseResponse> {
    try {
      const drafts = await this.projectRepository.find({
        where: {
          tutor: {id: id},
          status: ProjectStatus.DRAFT
        }
      })

      const active = await this.projectRepository.find({
        where: {
          tutor: {id: id},
          status: ProjectStatus.ACTIVE
        }
      })

      const assigned = await this.projectRepository.find({
        where: {
          tutor: {id: id},
          status: ProjectStatus.ASSIGNED
        }
      })

      const total = drafts.length + active.length + assigned.length

      return {
        status: 201,
        message: 'successful',
        response: {drafts: drafts.length,
          active: active.length,
          assigned: assigned.length,
          total: total
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

  
}
