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

  // async getAllProjects(): Promise<BaseResponse> {
  //   try {
  //     const projects = await this.projectRepository.find({
  //       relations: {
  //         tutor: true,
  //         chosenProjects: true,
  //         prerequisiteModules: true,
  //       },
  //     });
  //     if (projects) {
  //       return {
  //         status: 201,
  //         message: 'successful',
  //         response: projects,
  //       };
  //     }
  //     return {
  //       status: 404,
  //       message: 'There are no projects',
  //     };
  //   } catch (error) {
  //     return {
  //       status: 400,
  //       message: 'Bad Request',
  //       response: error,
  //     };
  //   }
  // }

  //   async getAllProjects(filters: any): Promise<BaseResponse> {
  //     const { search, modules, tutorId, sortBy, sortOrder } = filters;

  //     // Initialize query builder
  //     const query = this.projectRepository
  //       .createQueryBuilder('project')
  //       .leftJoin('project.chosenProjects', 'chosenProjects')
  //       .leftJoin('project.prerequisiteModules', 'prerequisiteModules')
  //       .leftJoin('project.tutor', 'tutor')
  //       .leftJoin('tutor.user', 'user')
  //       .select([
  //         'project.id',
  //         'project.title',
  //         'project.description',
  //         'project.expectedDeliverable',
  //         'project.tags',
  //         'project.resources',
  //         'project.createdAt',
  //         'project.updatedAt',
  //         'tutor.id',
  //         'MAX(user.name) AS tutorname',
  //         'COUNT(chosenProjects.id) AS popularity',
  //       ])
  //       .groupBy('chosenProjects.id')
  //       .addGroupBy('project.id')
  //       .addGroupBy('tutor.id')
  //       .addGroupBy('user.id') // Group by user fields
  //       .addGroupBy('project.title')
  //       .addGroupBy('project.description')
  //       .addGroupBy('project.expectedDeliverable')
  //       .addGroupBy('project.resources')
  //       .addGroupBy('project.createdAt')
  //       .addGroupBy('project.updatedAt')
  //       .orderBy('popularity', 'DESC');

  //     const [sql, parameters] = query.getQueryAndParameters();
  //     console.log('Generated SQL Query:', sql);
  //     console.log('Parameters:', parameters);

  //     // Search by project title
  //     // if (search) {
  //     //   query.andWhere('project.title ILIKE :search', { search: `%${search}%` });
  //     // }

  //     if (search) {
  //       query.andWhere(
  //         new Brackets((qb) => {
  //           qb.where('project.title ILIKE :search', {
  //             search: `%${search}%`,
  //           }).orWhere('project.tags && ARRAY[:...tags]', { tags: [search] });
  //         }),
  //       );
  //     }

  //     // Filter by tags
  //     // if (tags && tags.length) {
  //     //   query.andWhere('project.tags && ARRAY[:...tags]', { tags });
  //     // }

  //     if (modules) {
  //       query.andWhere('prerequisiteModules.id = :modules', { modules });
  //     }

  //     // Filter by tutor
  //     if (tutorId) {
  //       query.andWhere('tutor.id = :tutorId', { tutorId });
  //     }

  //     // Sort by popularity (number of chosenProjects) or recent (creation date)
  //     if (sortBy === 'popularity') {
  //       query
  //         .addSelect('COUNT(chosenProjects.id)', 'popularity')
  //         .orderBy('popularity', sortOrder);
  //     } else if (sortBy === 'recent') {
  //       query.orderBy('project.createdAt', sortOrder);
  //     }

  //     // Group by project ID to support aggregation
  //     query.groupBy('project.id, tutor.id');

  //     // Execute the query
  //     const projects = await query.getMany();

  //     return {
  //       status: 201,
  //       message: 'Projects fetched successfully',
  //       response: {
  //         projects: projects,
  //         pagination: {
  //           currentPage: page,
  //           totalPages,
  //           totalCount,
  //           limit,
  //         },
  //     };
  //   }
  // }

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
        'tutor.id AS tutor_id',
        'ARRAY_AGG(DISTINCT module.id) AS module_ids',
        'ARRAY_AGG(DISTINCT module.name) AS module_names',
      ])
      .addSelect('MAX(user.name)', 'tutorname') // Alias the aggregated tutor name
      .addSelect('COUNT(chosenProjects.id)', 'popularity') // Alias the count of chosen projects
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
    console.log(query.getSql());

    const [sql, parameters] = query.getQueryAndParameters();
    // console.log('Generated SQL Query:', sql);
    // console.log('Parameters:', parameters);

    // Execute the query
    const projects = await query.getRawMany();

    const totalCount = await this.projectRepository.count(); // Get the total count of projects
    const totalPages = Math.ceil(totalCount / limit);
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

  // get projects by tutor id
  async getProjectByTutor(id: number): Promise<BaseResponse> {
    try {
      const projects = await this.projectRepository.find({
        where: {
          tutor: await this.tutorProfileRepository.findOne({
            where: { id: id },
          }),
        },
      });
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

  // choose project
  async chooseProject(
    id: number,
    dto: ChooseProjectDto,
  ): Promise<BaseResponse> {
    try {
      const student = await this.studentProfileRepository.findOne({
        where: { id: dto.studentId },
      });
      if (!student) {
        return {
          status: 404,
          message: 'student does not exist',
        };
      }

      let newChoice = new ChosenProject();
      newChoice.project = await this.projectRepository.findOne({
        where: { id: dto.projectId },
      });
      newChoice.student = student;
      newChoice.rank = dto.rank;
      const chosenProject = await this.chosenProjectRepository.save(newChoice);
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

  // ask abinaya about file upload for projects
}
