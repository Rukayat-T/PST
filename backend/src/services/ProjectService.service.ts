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
import { Brackets, In, Repository } from 'typeorm';
import { RateStatement } from '../DTOs/RateSTatementDto.dto';
import { CreateAdminInputDto } from 'src/DTOs/AdminInputRequestDto.dto';
import { AdminInputRequest } from 'src/entities/AdminInputRequest.enity';
import { Not } from 'typeorm';
import { UpdateProjectsRanks } from 'src/DTOs/UpdateProjectsRanksDto.dto';

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
        project.contactTutor = tutor.contactLink
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
      .addSelect('COUNT(DISTINCT chosenProjects.id)', 'popularity') // Alias the count of chosen projects
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

  async chooseProjectold(
    id: number,
    dto: ChooseProjectDto,
  ): Promise<BaseResponse> {
    try {
      // Check for student
      const student = await this.studentProfileRepository.findOne({
        where: { id: id },
        relations: ['previousModules'],
      });
      if (!student) {
        return { status: 404, message: 'student not found' };
      }
  
      // Fetch project with its prerequisite modules
      const project = await this.projectRepository.findOne({
        where: { id: dto.projectId },
        relations: ['prerequisiteModules'],
      });
      if (!project) {
        return { status: 404, message: 'project not found' };
      }
  
      // Check if project previously chosen
      const chosenProjectDb = await this.chosenProjectRepository.findOne({
        where: {
          project: { id: dto.projectId },
          student: { id: id },
        },
      });
      if (chosenProjectDb) {
        return { status: 400, message: 'student has already chosen this project' };
      }
  
      // Find all projects the student has already chosen
      let chosenProjects = await this.chosenProjectRepository.find({
        where: { student: { id: id } },
        order: { rank: 'ASC' },
      });
  
      // If already 5 choices made
      if (chosenProjects.length >= 5) {
        return { status: 400, message: 'You cannot choose more than 5 projects' };
      }
  
      // Shift ranks for existing projects to make space
      for (let i = chosenProjects.length - 1; i >= 0; i--) {
        if (chosenProjects[i].rank >= dto.rank) {
          chosenProjects[i].rank += 1;
          if (chosenProjects[i].rank > 5) {
            // Delete project if it overflows beyond 5
            await this.chosenProjectRepository.remove(chosenProjects[i]);
          } else {
            await this.chosenProjectRepository.save(chosenProjects[i]);
          }
        }
      }
  
      // Create and save the new project choice
      const newChoice = new ChosenProject();
      newChoice.project = project;
      newChoice.student = student;
      newChoice.rank = dto.rank;
      newChoice.statementOfInterest = dto.statementOfInterest;
      newChoice.statementOfInterestScore = dto.statementOfInterest === "" ? 0 : undefined;
      newChoice.hasCommunicated = dto.hasCommunicated;
  
      // Check prerequisites
      const studentModules = new Set(student.previousModules.map((mod) => mod.id));
      const missingModules = project.prerequisiteModules.filter(
        (mod) => !studentModules.has(mod.id),
      );
  
      if (missingModules.length > 0) {
        newChoice.status = ChoiceStatus.NOT_SELECTED;
      } else {
        newChoice.status = ChoiceStatus.APPLIED;
      }
  
      const chosenProject = await this.chosenProjectRepository.save(newChoice);
  
      // Send notification emails
      await this.mailService.sendProjectApplicationMailToTutor(
        chosenProject.project,
        student,
        chosenProject.status,
      );
      await this.mailService.sendProjectApplicationMailToStudent(
        chosenProject.project,
        student,
        chosenProject.status,
      );
  
      // Log activity
      this.logActivity(
        ActionType.APPLIED_FOR_PROJECT,
        chosenProject.project.tutor.id,
        id,
        dto.projectId,
      );
  
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

  async chooseProject(
    id: number,
    dto: ChooseProjectDto,
  ): Promise<BaseResponse> {
    try {
      // Step 1: Fetch student
      const student = await this.studentProfileRepository.findOne({
        where: { id: id },
        relations: ['previousModules'],
      });
      if (!student) {
        return { status: 404, message: 'student not found' };
      }
  
      // Step 2: Fetch project with prerequisites
      const project = await this.projectRepository.findOne({
        where: { id: dto.projectId },
        relations: ['prerequisiteModules'],
      });
      if (!project) {
        return { status: 404, message: 'project not found' };
      }
  
      // Step 3: Check if project was already chosen
      const chosenProjectDb = await this.chosenProjectRepository.findOne({
        where: {
          project: { id: dto.projectId },
          student: { id: id },
        },
      });
      if (chosenProjectDb) {
        return { status: 400, message: 'student has already chosen this project' };
      }
  
      // Step 4: Fetch all current choices
      let chosenProjects = await this.chosenProjectRepository.find({
        where: { student: { id: id } },
        order: { rank: 'ASC' },
      });
  
      // Early block if already has 5 projects
      if (chosenProjects.length >= 5) {
        return { status: 400, message: 'You cannot choose more than 5 projects, remove one choice' };
      }
  
      // Step 5: Shift ranks locally
      for (let proj of chosenProjects) {
        if (proj.rank >= dto.rank) {
          proj.rank += 1;
        }
      }
  
      // Step 6: Split into saves and deletes
      const toSave = chosenProjects.filter((p) => p.rank <= 5);
      const toDelete = chosenProjects.filter((p) => p.rank > 5);
  
      // Batch save and delete
      if (toSave.length > 0) {
        await this.chosenProjectRepository.save(toSave);
      }
      if (toDelete.length > 0) {
        await this.chosenProjectRepository.remove(toDelete);
      }
  
      // Step 7: Reload choices after shifting
      chosenProjects = await this.chosenProjectRepository.find({
        where: { student: { id: id } },
      });
  
      if (chosenProjects.length >= 5) {
        return { status: 400, message: 'You cannot choose more than 5 projects' };
      }
  
      // Step 8: Create new choice
      const newChoice = new ChosenProject();
      newChoice.project = project;
      newChoice.student = student;
      newChoice.rank = dto.rank;
      newChoice.statementOfInterest = dto.statementOfInterest;
      newChoice.statementOfInterestScore = dto.statementOfInterest === "" ? 0 : undefined;
      newChoice.hasCommunicated = dto.hasCommunicated;
  
      // Step 9: Check prerequisites
      const studentModules = new Set(student.previousModules.map((mod) => mod.id));
      const missingModules = project.prerequisiteModules.filter(
        (mod) => !studentModules.has(mod.id),
      );
  
      newChoice.status = missingModules.length > 0
        ? ChoiceStatus.NOT_SELECTED
        : ChoiceStatus.APPLIED;
  
      const chosenProject = await this.chosenProjectRepository.save(newChoice);
  
      // Step 10: Send notification emails
      await this.mailService.sendProjectApplicationMailToTutor(
        chosenProject.project,
        student,
        chosenProject.status,
      );
      await this.mailService.sendProjectApplicationMailToStudent(
        chosenProject.project,
        student,
        chosenProject.status,
      );
  
      // Step 11: Log activity
      this.logActivity(
        ActionType.APPLIED_FOR_PROJECT,
        chosenProject.project.tutor.id,
        id,
        dto.projectId,
      );
  
      return {
        status: 201,
        message: 'successful',
        response: chosenProject,
      };
  
    } catch (error) {
      console.error(error); // Always good for debugging in dev
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

      await this.chosenProjectRepository.remove(chosenProject);

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

async assignProjectToStudent(studentId: number, projectId: number): Promise<BaseResponse> {
  try {
    // Step 1: Find student
    const student = await this.studentProfileRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      return { status: 404, message: 'student does not exist' };
    }

    // Step 2: Find project
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: {
        tutor: true,
        chosenByStudents: true,
      },
    });
    if (!project) {
      return { status: 404, message: 'Project not found, enter valid id' };
    }

    // Step 3: Find student's application for this project
    const app = await this.chosenProjectRepository.findOne({
      where: {
        project: { id: projectId },
        student: { id: studentId },
      },
    });

    if (!app) {
      return { status: 404, message: 'Application not found for this student and project' };
    }

    // Step 4: Update assigned student's application to ALLOCATED
    app.status = ChoiceStatus.ALLOCATED;
    await this.chosenProjectRepository.save(app);

    // Step 5: Update project status
    project.status = ProjectStatus.ASSIGNED;
    project.assignedStudents = [student];
    await this.projectRepository.save(project);

    // Step 6: Update student entity
    student.assignedProject = project;
    await this.studentProfileRepository.save(student);

    // Step 7: Update OTHER students' applications for this project to NOT_SELECTED
    const otherApplications = await this.chosenProjectRepository.find({
      where: {
        project: { id: projectId },
        student: { id: Not(studentId) },
      },
    });

    if (otherApplications.length > 0) {
      for (let otherApp of otherApplications) {
        otherApp.status = ChoiceStatus.NOT_SELECTED;
      }
      await this.chosenProjectRepository.save(otherApplications);
    }

    // Step 8: Update THIS student's applications for OTHER projects to NOT_SELECTED
    const studentOtherApplications = await this.chosenProjectRepository.find({
      where: {
        student: { id: studentId },
        project: { id: Not(projectId) },
      },
    });

    if (studentOtherApplications.length > 0) {
      for (let otherApp of studentOtherApplications) {
        otherApp.status = ChoiceStatus.NOT_SELECTED;
      }
      await this.chosenProjectRepository.save(studentOtherApplications);
    }

    // Step 9: Send email to the assigned student
    await this.mailService.sendProjectApplicationStatusUpdateToStudent(
      project,
      student,
      app.status
    );

    return {
      status: 201,
      message: 'successfully assigned',
    };

  } catch (error) {
    console.error(error);
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
        admin: {id: adminId},
        project: {status: ProjectStatus.ACTIVE}
      },
      relations: ['admin', 'project', 'project.tutor.user']
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
      relations: ['project', 'project.tutor.user']
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

async updateProjectsRanksold(studentId: number, dto: UpdateProjectsRanks): Promise<BaseResponse> {
  try {

    const student = await this.studentProfileRepository.findOne({
      where: { id: studentId },
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

    const choices = dto.choices
    for(let choice of choices){
      const checkChoice = await this.chosenProjectRepository.findOne({where: {id: choice.choiceId}})
      if (!checkChoice) {
        return {
          status: 404,
          message: 'student application does not exist',
        };
      }

      checkChoice.rank = choice.rank
      await this.chosenProjectRepository.save(checkChoice)
    }

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

async updateProjectsRanks(studentId: number, dto: UpdateProjectsRanks): Promise<BaseResponse> {
  try {
    const student = await this.studentProfileRepository.findOne({
      where: { id: studentId },
      relations: [
        'chosenProjects',
        'chosenProjects.project',
        'chosenProjects.project.tutor.user',
      ],
    });

    if (!student) {
      return {
        status: 404,
        message: 'Student does not exist',
      };
    }

    const choices = dto.choices;
    const choiceIds = choices.map((c) => c.choiceId);

    // Fetch all relevant ChosenProject entries in one query
    const existingChoices = await this.chosenProjectRepository.findBy({
      id: In(choiceIds),
    });

    // Optional: validate that all provided IDs exist
    if (existingChoices.length !== choiceIds.length) {
      return {
        status: 404,
        message: 'One or more project choices not found',
      };
    }

    // Create a lookup for incoming ranks
    const rankMap = new Map(choices.map((c) => [c.choiceId, c.rank]));

    // Update ranks in memory
    for (const choice of existingChoices) {
      const newRank = rankMap.get(choice.id);
      if (newRank !== undefined) {
        choice.rank = newRank;
      }
    }

    // Save all updates in a single DB call
    await this.chosenProjectRepository.save(existingChoices);

    return {
      status: 200,
      message: 'Ranks updated successfully',
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

