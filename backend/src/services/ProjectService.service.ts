import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChooseProjectDto } from 'src/DTOs/ChooseprojectDto.dto';
import { CreateProjectDto } from 'src/DTOs/CreateProject.dto';
import { EditProjectDto } from 'src/DTOs/EditProjectDto.dto';
import { ChosenProject } from 'src/entities/ChosenProject';
import { ModulesEntity } from 'src/entities/Modules';
import { ProjectEntity } from 'src/entities/Project.entity';
import { StudentProfile } from 'src/entities/StudentProfile.entity';
import { TutorProfile } from 'src/entities/TutorProfile.entity';
import { BaseResponse } from 'src/Responses/BaseResponse';
import { ProjectStatus } from 'src/util/ProjectStatus.enum';
import { Brackets, Repository } from 'typeorm';

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
      // .where('tutor.status = :status', { status })
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
        .select([
          'project.id',
          'project.title',
          'project.description',
          'project.expectedDeliverable',
          'project.tags',
          'project.resources',
          'project.createdAt',
          'project.updatedAt',
          'tutor.id AS tutor_id',
          'ARRAY_AGG(DISTINCT module.id) AS module_ids',
          'ARRAY_AGG(DISTINCT module.name) AS module_names',
        ])
        .addSelect('MAX(user.name)', 'tutorname') // Alias the aggregated tutor name
        .addSelect('COUNT(chosenProjects.id)', 'popularity') // Alias the count of chosen projects
        .where('tutor.id = :id', { id }) // Filter by tutor ID
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
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // choose project
  async chooseProject(
    id: number,
    dto: ChooseProjectDto,
  ): Promise<BaseResponse> {
    try {
      const student = await this.studentProfileRepository.findOne({
        where: { id: id },
      });
      if (!student) {
        return {
          status: 404,
          message: 'student does not exist',
        };
      }

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
      } else {
        let newChoice = new ChosenProject();
        newChoice.project = await this.projectRepository.findOne({
          where: { id: dto.projectId },
        });
        newChoice.student = student;
        newChoice.rank = dto.rank;
        const chosenProject = await this.chosenProjectRepository.save(
          newChoice,
        );
        return {
          status: 201,
          message: 'successful',
          response: chosenProject,
        };
      }
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
}
