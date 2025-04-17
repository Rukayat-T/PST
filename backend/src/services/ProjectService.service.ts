import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChooseProjectDto } from 'src/DTOs/ChooseprojectDto.dto';
import { CreateProjectDto } from 'src/DTOs/CreateProject.dto';
import { EditProjectDto } from 'src/DTOs/EditProjectDto.dto';
import { UpdateChoiceStatusDto } from 'src/DTOs/UpdateChoiceStatusDto.dto';
import { ActivityEntity } from 'src/entities/Activities.entity';
import { ChosenProject } from 'src/entities/ChosenProject';
import { ModulesEntity } from 'src/entities/Modules';
import { ProjectEntity } from 'src/entities/Project.entity';
import { StudentProfile } from 'src/entities/StudentProfile.entity';
import { TutorProfile } from 'src/entities/TutorProfile.entity';
import { MailService } from 'src/Mail/Mail.service';
import { BaseResponse } from 'src/Responses/BaseResponse';
import { ActionType } from 'src/util/ActionType.enum';
import { ChoiceStatus } from 'src/util/ChoiceStatus.enum';
import { ProjectStatus } from 'src/util/ProjectStatus.enum';
import { Brackets, Repository } from 'typeorm';
import { RateStatement } from '../DTOs/RateSTatementDto.dto';
import { CreateAdminInputDto } from 'src/DTOs/AdminInputRequestDto.dto';
import { AdminInputRequest } from 'src/entities/AdminInputRequest.enity';

@Injectable()
export class ProjectService {
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
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: Repository<ActivityEntity>,
    @InjectRepository(AdminInputRequest)
    private readonly adminInputRequstRepository: Repository<AdminInputRequest>,

    private readonly mailService: MailService,
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

  async createProject(dto: CreateProjectDto): Promise<BaseResponse> {
    try {
      let project = new ProjectEntity();
      project.title = dto.title;
      project.description = dto.description;
      project.expectedDeliverable = dto.expectedDeliverable;
      project.tags = dto.tags;
      project.status = dto.status
      if (dto?.resources) {
        project.resources = dto.resources;
      }
      let prerequisiteModules = [];
      for (let i = 0; i < dto.prerequisiteModuleIds.length; i++) {
        let module = await this.modulesRepository.findOne({
          where: { id: dto.prerequisiteModuleIds[i] },
        });
        prerequisiteModules.push(module);
      }
      project.prerequisiteModules = prerequisiteModules;
      const tutor = await this.tutorProfileRepository.findOne({
        where: { id: dto.tutorId },
      });

      if (!tutor) {
        return {
          status: 404,
          message: 'tutor not found, enter a valid id',
        };
      } else {
        project.tutor = tutor;
        const newProject = await this.projectRepository.save(project);
        this.logActivity(ActionType.PROJECT_CREATED, dto.tutorId, undefined, newProject.id, undefined)
        return {
          status: 201,
          message: 'successful',
          response: newProject,
        };
      }
    } catch (error) {
      console.log(error);
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  async getAllProjects(filters: any): Promise<BaseResponse> {
    const {
      search,
      modules,
      tutorId,
      sortBy,
      sortOrder,
      page = 1,
      limit = 9,
    } = filters;

    const status = ProjectStatus.ACTIVE;

    // Initialize query builder
    const query = this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.chosenProjects', 'chosenProjects')
      .leftJoin('project.tutor', 'tutor')
      .leftJoin('tutor.user', 'user')
      .leftJoin('project.prerequisiteModules', 'module')
      .select([
        'project.id',
        'project.title',
        'project.description',
        'project.expectedDeliverable',
        'project.tags',
        'project.resources',
        'project.createdAt',
        'project.updatedAt',
        'project.status',
        'tutor.id AS tutor_id',
        'ARRAY_AGG(DISTINCT module.id) AS module_ids',
        'ARRAY_AGG(DISTINCT module.name) AS module_names',
      ])
      .addSelect('MAX(user.name)', 'tutorname') // Alias the aggregated tutor name
      .addSelect('COUNT(chosenProjects.id)', 'popularity') // Alias the count of chosen projects
      .where('project.status = :status', { status })
      .groupBy('project.id')
      .addGroupBy('tutor.id')
      .addGroupBy('user.id')
      .addGroupBy('project.title')
      .addGroupBy('project.description')
      .addGroupBy('project.expectedDeliverable')
      .addGroupBy('project.tags')
      .addGroupBy('project.resources')
      .addGroupBy('project.createdAt')
      .addGroupBy('project.updatedAt')
      .orderBy('project.id', 'ASC');
    // .orderBy('popularity', 'DESC');

    // Search by project title or tags
    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('project.title ILIKE :search', {
            search: `%${search}%`,
          }).orWhere('project.tags && ARRAY[:...tags]', { tags: [search] });
        }),
      );
    }

    // Filter by module
    if (modules) {
      query.andWhere('module.id = :modules', { modules }); // Filter by a single module
    }

    // Filter by tutor
    if (tutorId) {
      query.andWhere('tutor.id = :tutorId', { tutorId });
    }

    // Sort by popularity (number of chosenProjects) or recent (creation date)
    if (sortBy === 'popularity') {
      query
        .addSelect('COUNT(chosenProjects.id)', 'popularity')
        .orderBy('popularity', sortOrder);
    } else if (sortBy === 'recent') {
      query.orderBy('project.createdAt', sortOrder);
    }

    const offset = (page - 1) * limit;
    // query.skip(offset).take(limit);

    query.offset(offset).limit(limit);
    // console.log(query.getSql());

    // const [sql, parameters] = query.getQueryAndParameters();
    // console.log('Generated SQL Query:', sql);
    // console.log('Parameters:', parameters);

    // Execute the query
    const projects = await query.getRawMany();
    // console.log(projects);

    const totalCount = await query.getCount();

    // const totalCount = projects.length; // Get the total count of projects
    const totalPages = Math.ceil(Number(totalCount) / limit);

    return {
      status: 201,
      message: 'Projects fetched successfully',
      response: {
        projects,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
        },
      },
    };
  }

  async getProjectById(id: number): Promise<BaseResponse> {
    try {
      const project = await this.projectRepository.findOne({
        where: { id: id },
        relations: {
          tutor: true,
          chosenByStudents: true,
        },
      });
      if (project) {
        return {
          status: 201,
          message: 'successful',
          response: project,
        };
      }
      return {
        status: 404,
        message: 'Project not found, enter valid id',
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // get projects by tutor id without filter
  async getProjectByTutorNoFilter(id: number): Promise<BaseResponse> {
    try {
      const projects = await this.projectRepository.find({
        where: { tutor: { id } }, // Match tutor by ID
        relations: ['tutor'], // Ensure the tutor relationship is loaded
      });
      // const projects = await this.projectRepository.find({
      //   where: {
      //     tutor: await this.tutorProfileRepository.findOne({
      //       where: { id: id },
      //     }),
      //   },
      // });
      if (!projects) {
        return {
          status: 404,
          message: 'no projects created by this tutor',
        };
      }
      return {
        status: 201,
        message: 'successful',
        response: projects,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // get projects by tutor id with filter and search
  async getProjectByTutor(id: number, filters: any): Promise<BaseResponse> {
    const { search, sortBy, sortOrder, page = 1, limit = 15 } = filters;
    try {
      const query = this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.chosenProjects', 'chosenProjects')
      .leftJoin('project.tutor', 'tutor')
      .leftJoin('tutor.user', 'user')
      .leftJoin('project.prerequisiteModules', 'module')
      .leftJoin('project.conflict', 'conflict') // Join the conflicts relationship
      .select([
        'project.id',
        'project.title',
        'project.description',
        'project.expectedDeliverable',
        'project.tags',
        'project.status',
        'project.resources',
        'project.createdAt',
        'project.updatedAt',
        'tutor.id AS tutor_id',
        'ARRAY_AGG(DISTINCT module.id) AS module_ids',
        'ARRAY_AGG(DISTINCT module.name) AS module_names',
      ])
      .addSelect('MAX(user.name)', 'tutorname') // Alias the aggregated tutor name
      .addSelect('COUNT(chosenProjects.id)', 'popularity') // Alias the count of chosen projects
      .addSelect('COUNT(conflict.id)', 'conflict_count') // Alias the count of conflicts for the project
      .where('tutor.id = :id', { id }) // Filter by tutor ID
      // .where('chosenProject.status')
      .groupBy('project.id')
      .addGroupBy('tutor.id')
      .addGroupBy('user.id')
      .addGroupBy('project.title')
      .addGroupBy('project.description')
      .addGroupBy('project.expectedDeliverable')
      .addGroupBy('project.tags')
      .addGroupBy('project.resources')
      .addGroupBy('project.createdAt')
      .addGroupBy('project.updatedAt');

      // Search by project title or tags
      if (search) {
        query.andWhere(
          new Brackets((qb) => {
            qb.where('project.title ILIKE :search', {
              search: `%${search}%`,
            }).orWhere('project.tags && ARRAY[:...tags]', { tags: [search] });
          }),
        );
      }

      // Sorting logic
      if (sortBy === 'popularity') {
        query
          .addSelect('COUNT(chosenProjects.id)', 'popularity')
          .orderBy('popularity', sortOrder);
      } else if (sortBy === 'recent') {
        query.orderBy('project.createdAt', sortOrder);
      } else if (sortBy === 'title') {
        query.orderBy('project.title', sortOrder);
      } else {
        // Default sorting by project ID
        query.orderBy('project.id', 'ASC');
      }

      // const projectsCount = (await query.getRawMany()).length;
      // console.log(projectsCount, '---------projects count');

      // Pagination
      const offset = (page - 1) * limit;
      query.offset(offset).limit(limit);

      // Execute the query
      const projects = await query.getRawMany();
      // console.log(projects);

      const totalCount = await query.getCount();

      // const totalCount = projects.length; // Get the total count of projects
      const totalPages = Math.ceil(Number(totalCount) / limit);

      const formattedProjects = projects.map((project) => ({
        ...project,
        hasConflict: project.conflict_count > 0, // Set conflict flag based on count
      }));

      return {
        status: 201,
        message: 'Projects fetched successfully',
        response: {
          formattedProjects,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
          },
        },
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

  async testMail(): Promise<any>
  {
    const project = await this.projectRepository.findOne({
      where: { id: 1},
      relations: ['prerequisiteModules']
    })

    const student = await this.studentProfileRepository.findOne({
      where: { id: 1 },
      relations : ['previousModules']
    });
    return await this.mailService.sendProjectApplicationStatusUpdateToStudent(project, student, ChoiceStatus.ALLOCATED)
    
  }

  /*
  Check if the student already has a project with the same rank.
  If yes, push it down by 1.
  If a project is already at rank 3, push it to rank 4, and so on.
  Ensure no project exceeds rank 5.
  */
 /*
 Steps to Implement Mandatory Checking
Fetch the student's completed modules.
Fetch the project's prerequisite modules.
Check if the student has completed all required prerequisites.
If not, reject the application immediately.
Otherwise, proceed with saving the chosen project.
 */
  // choose project
  async chooseProject(
    id: number,
    dto: ChooseProjectDto,
  ): Promise<BaseResponse> {
    try {
      //check for student
      const student = await this.studentProfileRepository.findOne({
        where: { id: id },
        relations : ['previousModules']
      });
      if (!student) {
        return {
          status: 404,
          message: 'student not found',
        };
      }

      // fetch project with it's prerequisite modules
      const project = await this.projectRepository.findOne({
        where: { id: dto.projectId},
        relations: ['prerequisiteModules']
      })
      if (!project) {
        return {
          status: 404,
          message: 'project not found',
        };
      }

      //check if project previously chosen
      const chosenProjectDb = await this.chosenProjectRepository.findOne({
        where: {
          project: { id: dto.projectId },
          student: { id: id },
        },
      });
      if (chosenProjectDb) {
        return {
          status: 400,
          message: 'student has already chosen this project',
        };
      } 
    
      // Find all projects the student has already chosen
      let chosenProjects = await this.chosenProjectRepository.find({
        where: { student: { id: id } },
        order: { rank: 'ASC' }, // Ensure ordered by rank
      });
      if (chosenProjects.length >= 5) {
        return { status: 400, message: 'You cannot choose more than 5 projects' };
      }

      // Check if the student already has a project at this rank
      let projectAtRank = chosenProjects.find((p) => p.rank === dto.rank);
      if (projectAtRank) {
        // Shift ranks for existing projects to make space
        for (let i = chosenProjects.length - 1; i >= 0; i--) {
          if (chosenProjects[i].rank >= dto.rank && chosenProjects[i].rank < 5) {
            chosenProjects[i].rank += 1;
            await this.chosenProjectRepository.save(chosenProjects[i]);
          }
        }
      }

      // Create and save the new choice
      let newChoice = new ChosenProject();
      newChoice.project = await this.projectRepository.findOne({
        where: { id: dto.projectId },
      });
      newChoice.student = student;
      newChoice.rank = dto.rank;
      newChoice.statementOfInterest = dto.statementOfInterest
      if (dto.statementOfInterest === "") newChoice.statementOfInterestScore = 0 
      newChoice.hasCommunicated = dto.hasCommunicated

      // Mandatory check: Ensure the student has completed all prerequisite modules
      const studentModules = new Set(student.previousModules.map((mod) => mod.id));
      const missingModules = project.prerequisiteModules.filter((mod) => !studentModules.has(mod.id));
 
      if (missingModules.length > 0) {
        newChoice.status = ChoiceStatus.NOT_SELECTED
      }
      else{
        newChoice.status = ChoiceStatus.APPLIED
      }

      const chosenProject = await this.chosenProjectRepository.save(newChoice);

      this.mailService.sendProjectApplicationMailToTutor(chosenProject.project, student, chosenProject.status)
      this.mailService.sendProjectApplicationMailToStudent(chosenProject.project, student, chosenProject.status)

      this.logActivity( ActionType.APPLIED_FOR_PROJECT, chosenProject.project.tutor.id, id, dto.projectId)

      return {
        status: 201,
        message: 'successful',
        response: chosenProject,
      };

    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // get projects chosen by student id
  async getStudentChoices(id: number): Promise<BaseResponse> {
    try {
      const student = await this.studentProfileRepository.findOne({
        where: { id: id },
        relations: [
          'chosenProjects',
          'chosenProjects.project',
          'chosenProjects.project.tutor.user'
          // 'chosenProjects.student ',
        ],
      });
      if (!student) {
        return {
          status: 404,
          message: 'student does not exist',
        };
      }

      return {
        status: 201,
        message: 'successful',
        response: student.chosenProjects,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // get project assigned to students by student id (not done)
  async getProjectAssignedToStudent(id: number): Promise<BaseResponse> {
    try {
      const student = await this.studentProfileRepository.findOne({
        where: {
          id: id,
        },
        relations: ['assignedProject']
      })

      const project = student.assignedProject

      return {
        status: 201,
        message: 'successful',
        response: project,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // edit project
  async editProject(
    id: number,
    editProjectDto: EditProjectDto,
  ): Promise<BaseResponse> {
    try {
      const project = await this.projectRepository.findOne({
        where: { id: id },
      });

      if (!project) {
        return {
          status: 404,
          message: 'project does not exist',
        };
      }

      // Update fields
      if (editProjectDto.title) project.title = editProjectDto.title;
      if(editProjectDto.status) project.status =editProjectDto.status
      if (editProjectDto.description)
        project.description = editProjectDto.description;
      if (editProjectDto.expectedDeliverable) {
        project.expectedDeliverable = editProjectDto.expectedDeliverable;
      }
      if (editProjectDto.tags) project.tags = editProjectDto.tags;
      if (editProjectDto.prerequisiteModuleIds) {
        let prerequisiteModules = [];
        for (let i = 0; i < editProjectDto.prerequisiteModuleIds.length; i++) {
          let module = await this.modulesRepository.findOne({
            where: { id: editProjectDto.prerequisiteModuleIds[i] },
          });
          prerequisiteModules.push(module);
        }
        project.prerequisiteModules = prerequisiteModules;
      }
      if (editProjectDto.resources) {
        project.resources = editProjectDto.resources;
      }

      await this.projectRepository.save(project);
      return {
        status: 201,
        message: 'successful',
        response: project,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // delete project
  async deleteProject(id: number): Promise<BaseResponse> {
    try {
      const project = await this.projectRepository.findOne({
        where: { id: id },
      });

      if (!project) {
        return {
          status: 404,
          message: 'project does not exist',
        };
      }

      await this.projectRepository.delete(id);
      return {
        status: 201,
        message: 'project deleted',
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  async getAllTutorsWithProjects(): Promise<BaseResponse> {
    try {
      const projects = await this.projectRepository.find({
        relations: ['tutor', 'tutor.user'],
      });
      // projects.map((project) => project.tutor.user.name);

      const uniqueTutorNames = Array.from(
        new Set(projects.map((project) => project.tutor.user.name)),
      );

      // const tutors
      return {
        status: 201,
        message: 'successful',
        response: uniqueTutorNames,
      };
    } catch (error) {
      console.log(error);
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  async getAllModules(): Promise<BaseResponse> {
    try {
      const modules = await this.modulesRepository.find();
      return {
        status: 201,
        message: 'successful',
        response: modules,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  async removeProjectChoice(
    studentId: number,
    choiceId: number,
  ): Promise<BaseResponse> {
    try {
      const student = await this.studentProfileRepository.findOne({
        where: { id: studentId },
      });
      if (!student) {
        return {
          status: 404,
          message: 'student does not exist',
        };
      }

      const chosenProject = await this.chosenProjectRepository.findOne({
        where: {
          id: choiceId,
          student: { id: studentId },
        },
      });
      if (!chosenProject) {
        return {
          status: 400,
          message: 'student has not chosen this project',
        };
      }

      await this.chosenProjectRepository.delete(chosenProject);

      return {
        status: 201,
        message: 'choice successfully removed',
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  async editChoiceStatus(id: number, dto: UpdateChoiceStatusDto): Promise<BaseResponse> {
    try {
      const chosenProject = await this.chosenProjectRepository.findOne({
        where: {
          id: id
        },
        relations: ['student', 'project', 'project.tutor', 'project.tutor.user']
      });
      if (!chosenProject){
        return {
          status: 404,
          message: 'chosen project not found',
        };
      }

      chosenProject.status = dto.status

      this.chosenProjectRepository.save(chosenProject)

      if(chosenProject.status === ChoiceStatus.ALLOCATED){
        this.mailService.sendProjectApplicationStatusUpdateToStudent(chosenProject.project, chosenProject.student, chosenProject.status)
      }

      if(chosenProject.status === ChoiceStatus.NOT_SELECTED){
        this.mailService.sendProjectApplicationStatusUpdateToStudent(chosenProject.project, chosenProject.student, chosenProject.status)
      }

      if(chosenProject.status === ChoiceStatus.SHORTLISTED){
        // this.mailService.sendProjectApplicationStatusUpdateToStudent(chosenProject.project, chosenProject.student, chosenProject.status)
      }
      
      if(chosenProject.status === ChoiceStatus.UNDER_REVIEW){
        // this.mailService.sendProjectApplicationStatusUpdateToStudent(chosenProject.project, chosenProject.student, chosenProject.status)
      }

      if(chosenProject.status === ChoiceStatus.WITHDRAWN){
        //update tutor
      }

      return {
        status: 201,
        message: 'successful',
        response: chosenProject,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  async getStudentsAppsForProject(id: number): Promise<BaseResponse> {
    try {
      const project = await this.projectRepository.findOne({
        where: { id: id },
        relations: {
          tutor: true,
          chosenByStudents: true,
        },
      });
      if (!project) {
        return {
          status: 404,
          message: 'Project not found, enter valid id',
        };
      }

      const chosenProjects = await this.chosenProjectRepository.find({
        where: {
          project: { id: id },
        },
        relations: ['student'],
        // select: ['student'],
      });
      // console.log(chosenProjects)

      return {
        status: 201,
        message: 'successful',
        response: chosenProjects,
      };
    } catch (error) {
      console.log(error);
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

// Steps to Implement Ranking:
// Fetch students who applied for the project.
// Compute scores for each student based on:
// Project rank (higher rank = higher score)
// Statement of interest (if provided, boost score)
// Student communicated with tutor (boost score if true)
// Time of application (earlier = higher score)
// Sort students by score (higher score first).
// Return the sorted list with scores.

async getStudentsAppsForProjectRanked(id: number): Promise<BaseResponse> {

  const WEIGHTS = {
    projectRank: 0.4, // 40%
    statementOfInterest: 0.3, // 30%
    communication: 0.2, // 20%
    timeSubmitted: 0.1, // 10%
  };

  try {
    const project = await this.projectRepository.findOne({
      where: { id: id },
      relations: {
        tutor: true,
        chosenByStudents: true,
      },
    });
    if (!project) {
      return {
        status: 404,
        message: 'Project not found, enter valid id',
      };
    }
    const applications = await this.chosenProjectRepository.find({
      where: {
        project: { id: id },
      },
      relations: ['student'],
      order: { createdAt: 'ASC' }, // Sorting by submission time
    });

    if (applications.length === 0) {
      return {
        status: 201,
        message: 'No applications for this project',
      };
    }

    let studentsScores  = []
    const earliestTime = applications[0]?.createdAt;
    const latestTime = applications[applications.length - 1]?.createdAt;
    
    for (let application of applications){
      let rankScore = (6 - application.rank) / 5 // dividing by 5 to normalize between 0 and 1
      let statementScore = application.statementOfInterestScore / 10
      let communicationScore = application.hasCommunicated 
      let timeScore = (latestTime === earliestTime ) ? 1 :(latestTime.getTime() - application.createdAt.getTime()) / (latestTime.getTime() - earliestTime.getTime());
  
      let obj = {
        student: application,
        score:  rankScore * WEIGHTS.projectRank + statementScore * WEIGHTS.statementOfInterest + communicationScore * WEIGHTS.communication + timeScore * WEIGHTS.timeSubmitted
      }
      studentsScores.push(obj)
    }

    studentsScores.sort((a,b)=> b.score - a.score) // desc
    let bestStudent = studentsScores[0].student.student.user.name
    return {
      status: 201,
      message: 'applications found',
      response: 
      {rankedStudents: studentsScores,
        bestStudent
      }
    };
  }
  catch(error){
    console.log(error)
  }
}

async assignProjectToStudent(studentId: number, projectId: number) : Promise<BaseResponse>{
    try {
      const student = await this.studentProfileRepository.findOne({
        where: { id: studentId },
        // relations: [
        //   'chosenProjects',
        //   'chosenProjects.project'
        // ],
      });
      if (!student) {
        return {
          status: 404,
          message: 'student does not exist',
        };
      }

      const project = await this.projectRepository.findOne({
        where: { id: projectId },
        relations: {
          tutor: true,
          chosenByStudents: true,
        },
      });
      if (!project) {
        return {
          status: 404,
          message: 'Project not found, enter valid id',
        };
      }

      const app = await this.chosenProjectRepository.findOne({
        where: {
          project: {id: projectId},
          student: {id: studentId},
        }
      })

      //update application entity
      app.status = ChoiceStatus.ALLOCATED
      await this.chosenProjectRepository.save(app)
      await this.mailService.sendProjectApplicationStatusUpdateToStudent(project, student, app.status)

      //update project entity
      project.status = ProjectStatus.ASSIGNED
      const assignedStudents = [student]
      project.assignedStudents = assignedStudents
      await this.projectRepository.save(project)

      //update student entity
      student.assignedProject = project
      await this.studentProfileRepository.save(student)

      //change the other students' application status to not_assigned?
  
      return {
        status: 201,
        message: 'successfully assigned',
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

    async logActivity(
      actionType: ActionType,
      tutorId?: number,
      studentId?: number,
      projectId?: number,
      proposalId?: number
    ): Promise<void> {
      const tutor = await this.tutorProfileRepository.findOne({ where: { id: tutorId } });
      if (!tutor) throw new Error('Tutor not found');
  
      const student = studentId ? await this.studentProfileRepository.findOne({ where: { id: studentId } }) : null;
      if (studentId !== undefined && !student) throw new Error('Student not found');
  
      const project = projectId ? await this.projectRepository.findOne({ where: { id: projectId } }) : null;
      if (projectId !== undefined && !project) throw new Error('Project not found');
      const proposal = null;
  
      const activity = this.activityRepository.create({
        tutor,
        student,
        project,
        proposal,
        actionType,
      });
  
      await this.activityRepository.save(activity);
    }

async rateStatementOfInterest(choiceId: number, dto: RateStatement): Promise<BaseResponse>{
  try {

    const app = await this.chosenProjectRepository.findOne({
      where: {
        id: choiceId
      }
    })

    if (!app){
      return {
        status: 404,
        message: 'choice not found'
      };
    }
    app.statementOfInterestScore = dto.score

    this.chosenProjectRepository.save(app)

    return {
      status: 201,
      message: 'successful',
      response: app,
    };
  } catch (error) {
    return {
      status: 400,
      message: 'Bad Request',
      response: error,
    };
  }
}

async createAdminInputRequest(dto: CreateAdminInputDto): Promise<BaseResponse> {
  try {
    const project = await this.projectRepository.findOne({
      where: { id: dto.projectId },
      relations: {
      },
    });
    if (!project) {
      return {
        status: 404,
        message: 'Project not found, enter valid id',
      };
    } 

    const admin = await this.tutorProfileRepository.findOne({
      where: {
        id: dto.adminTutorProfileId,
        isAdmin: true
      }
    })

    let newRequest = new AdminInputRequest()
    newRequest.admin = admin
    newRequest.adminComments = null
    newRequest.project = project
    newRequest.proposal = null
    newRequest.tutorComments = dto.tutorComments

    const saved = await this.adminInputRequstRepository.save(newRequest)
    return {
      status: 201,
      message: 'successful',
      response: saved,
    };
  } catch (error) {
    return {
      status: 400,
      message: 'Bad Request',
      response: error,
    };
  }
  
}

async addAdminComments(requestId: number, comment: string): Promise<BaseResponse> {
  try {
    const request = await this.adminInputRequstRepository.findOne({
      where: {
        id: requestId
      }
    })
    if (!request){
      await this.adminInputRequstRepository.save(request)
    return {
      status: 404,
      message: 'request not found',
    };
    }

    request.adminComments = comment
    await this.adminInputRequstRepository.save(request)
    return {
      status: 201,
      message: 'successful',
      response: request,
    };
  } catch (error) {
    return {
      status: 400,
      message: 'Bad Request',
      response: error,
    };
  }
}

async getAdminInputRequest(requestId: number): Promise<BaseResponse> {
  try {
    const request = await this.adminInputRequstRepository.findOne({
      where: {
        id: requestId
      },
      relations: ['project', 'admin']
    })
    if (!request){
      await this.adminInputRequstRepository.save(request)
    return {
      status: 404,
      message: 'request not found',
    };
    }
    return {
      status: 201,
      message: 'successful',
      response: request,
    };
  } catch (error) {
    return {
      status: 400,
      message: 'Bad Request',
      response: error,
    };
  }
}

async getAllConflicts(adminId: number): Promise<BaseResponse>{
  try {
    const conflicts = await this.adminInputRequstRepository.find({
      where: {
        admin: {id: adminId}
      },
      relations: ['admin', 'project']
    }
    )
    if (!conflicts){
      return {
        status: 201,
        message: 'No conflicts',
      };
    }
    return {
      status: 201,
      message: 'successful',
      response: conflicts,
    };
  } catch (error) {
    return {
      status: 400,
      message: 'Bad Request',
      response: error,
    };
  }
}

async getConflict(id: number): Promise<BaseResponse> {
  try {
    const conflict = await this.adminInputRequstRepository.findOne({
      where:{
        id: id
      },
      relations: ['project']
    })
    if (!conflict){
      return {
        status: 404,
        message: 'Conflict not found',
      };
    }
    const project = conflict.project
    const applications = (await this.getStudentsAppsForProject(project.id))
    if (!applications.response){
      return {
        status: 404,
        message: 'There are no applications for this project',
      };
    }
    const projectApps = applications.response
    return {
      status: 201,
      message: 'successful',
      response: {conflict, applications: projectApps}
    };

  } catch (error) {
    return {
      status: 400,
      message: 'Bad Request',
      response: error,
    };
  }
}

async getConflictCommentsByProjectId(id: number): Promise<BaseResponse> {
  try {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: {
        conflict: true,
      },
    });
    if (!project) {
      return {
        status: 404,
        message: 'Project not found, enter valid id',
      };
    }
    const adminComment = project.conflict.adminComments
    const tutorComment = project.conflict.tutorComments
  
    return {
      status: 201,
      message: 'successful',
      response: {adminComment, tutorComment}
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

