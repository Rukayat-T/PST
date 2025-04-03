import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { CreateProjectDto } from 'src/DTOs/CreateProject.dto';
import { Role } from 'src/entities/role.enum';
import { JwtGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { BaseResponse } from 'src/Responses/BaseResponse';
import { ProjectService } from 'src/services/ProjectService.service';
import { ChooseProjectDto } from 'src/DTOs/ChooseprojectDto.dto';
import { EditProjectDto } from 'src/DTOs/EditProjectDto.dto';
import { ChoiceStatus } from 'src/util/ChoiceStatus.enum';
import { UpdateChoiceStatusDto } from 'src/DTOs/UpdateChoiceStatusDto.dto';
import { RateStatement } from 'src/DTOs/RateSTatementDto.dto';
import { CreateAdminInputDto } from 'src/DTOs/AdminInputRequestDto.dto';

@ApiBearerAuth()
@ApiTags('Projects Controller')
@Controller('Projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TUTOR)
  @Post('createProject')
  async createProject(@Body() dto: CreateProjectDto): Promise<BaseResponse> {
    return await this.projectService.createProject(dto);
  }

  // @UseGuards(JwtGuard)
  // @Get('getAllProjects')
  // async getAllProjects(): Promise<BaseResponse> {
  //   return await this.projectService.getAllProjects();
  // }

  // @Get()
  // @ApiQuery({
  //   name: 'search',
  //   required: false,
  //   type: String,
  //   description: 'Search by project title',
  // })
  // // @ApiQuery({
  // //   name: 'tags',
  // //   required: false,
  // //   type: [String],
  // //   description: 'Filter by tags (comma-separated)',
  // // })
  // @ApiQuery({
  //   name: 'modules',
  //   required: false,
  //   type: Number,
  //   description: 'Filter by prerequisite modules (IDs)',
  // })
  // @ApiQuery({
  //   name: 'tutorId',
  //   required: false,
  //   type: Number,
  //   description: 'Filter by tutor ID',
  // })
  // @ApiQuery({
  //   name: 'sortBy',
  //   required: false,
  //   enum: ['popularity', 'recent'],
  //   description:
  //     'Sort by "popularity" (number of students) or "recent" (creation date)',
  // })
  // @ApiQuery({
  //   name: 'sortOrder',
  //   required: false,
  //   enum: ['ASC', 'DESC'],
  //   description: 'Sort order: ASC (ascending) or DESC (descending)',
  // })
  // async getAllProjects(
  //   @Query('search') search?: string, // Search by project title
  //   @Query('modules') modules?: number, // Filter by prerequisite modules
  //   @Query('tutorId') tutorId?: number, // Filter by tutor ID
  //   @Query('sortBy') sortBy: 'popularity' | 'recent' = 'recent', // Sort by popularity or recent
  //   @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC', // Sort order: ASC/DESC
  // ): Promise<BaseResponse> {
  //   return await this.projectService.getAllProjects({
  //     search,
  //     modules,
  //     tutorId,
  //     sortBy,
  //     sortOrder,
  //   });
  // }

  @Get()
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search keyword for project title or description',
  })
  @ApiQuery({
    name: 'modules',
    required: false,
    type: Number,
    description: 'Filter by module ID',
  })
  @ApiQuery({
    name: 'tutorId',
    required: false,
    type: Number,
    description: 'Filter by tutor ID',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Sort projects by a specific attribute (e.g., popularity, recent)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (ascending or descending)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of projects per page (limit for pagination)',
  })
  async getAllProjects(
    @Query('search') search: string,
    @Query('modules') modules: number,
    @Query('tutorId') tutorId: number,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
    @Query('page') page: number = 1, // Default to page 1 if not provided
    @Query('limit') limit: number = 9, // Default to 9 results per page if not provided
  ): Promise<BaseResponse> {
    // Prepare the filters object
    const filters = {
      search,
      modules,
      tutorId,
      sortBy,
      sortOrder,
      page,
      limit,
    };

    // Call the service to fetch paginated projects
    return this.projectService.getAllProjects(filters);
  }

  // @UseGuards(JwtGuard)
  @Get('getProjectById/:id')
  async getProjectById(@Param('id') id: number): Promise<BaseResponse> {
    return await this.projectService.getProjectById(id);
  }

  // get projects by tutor id
  // @UseGuards(JwtGuard)
  @Get('getProjectsCreatedByTutor/:tutorId')
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search keyword for project title or description',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Sort projects by a specific attribute (e.g., popularity, recent, title)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (ascending or descending)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of projects per page (limit for pagination)',
  })
  async getProjectsByTutor(
    @Param('tutorId') tutorId: number,
    @Query('search') search: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
    @Query('page') page: number = 1, // Default to page 1 if not provided
    @Query('limit') limit: number = 15, // Default to 15 results per page if not provided
  ): Promise<BaseResponse> {
    const filters = {
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    };
    return await this.projectService.getProjectByTutor(tutorId, filters);
  }

  // get projects chosen by student id
  // @UseGuards(JwtGuard)
  @Get('getStudentChoices/:studentId')
  async getStudentChoices(
    @Param('studentId') studentId: number,
  ): Promise<BaseResponse> {
    return await this.projectService.getStudentChoices(studentId);
  }

  // get project assigned to students by student id
  // @UseGuards(JwtGuard)
  @Get('getProjectAssignedToStudent/:studentId')
  async getProjectAssignedToStudent(
    @Param('studentId') studentId: number,
  ): Promise<BaseResponse> {
    return await this.projectService.getProjectAssignedToStudent(studentId);
  }

  // @UseGuards(JwtGuard)
  // @Roles(Role.STUDENT,)
  @Post('chooseProject/:studentId')
  async chooseproject(
    @Param('studentId') studentId: number,
    @Body() dto: ChooseProjectDto,
  ): Promise<BaseResponse> {
    return await this.projectService.chooseProject(studentId, dto);
  }

  @Put('removeProjectChoice/:studentId/:choiceId')
  async removeProjectChoice(
    @Param('studentId') studentId: number,
    @Param('choiceId') choiceId: number,
  ): Promise<BaseResponse> {
    return await this.projectService.removeProjectChoice(studentId, choiceId);
  }

  // edit project
  @Put('updateProject/:id')
  async editProject(
    @Param('id') id: number,
    @Body() editProjectDto: EditProjectDto,
  ): Promise<BaseResponse> {
    return await this.projectService.editProject(id, editProjectDto);
  }

  // delete project
  @Delete('deleteProject/:id')
  async deleteProject(@Param('id') id: number): Promise<BaseResponse> {
    return await this.projectService.deleteProject(id);
  }

  @Get('getAllTutorsWithProjects')
  async getallTutorsWithProjects(): Promise<BaseResponse> {
    return await this.projectService.getAllTutorsWithProjects();
  }

  @Get('getAllModules')
  async getAllModules(): Promise<BaseResponse> {
    return await this.projectService.getAllModules();
  }

  @Get('getStudentsAppsForProject/:projectId')
  async getStudentsAppsForProject(
    @Param('projectId') projectId: number,
  ): Promise<BaseResponse> {
    return await this.projectService.getStudentsAppsForProjectRanked(projectId);
  }

  @Put("updateStudentChoiceStatus/:choiceId")
  async updateStudentChoiceStatus(@Param('choiceId') choiceId: number, @Body() updatechoiceDto: UpdateChoiceStatusDto): Promise<BaseResponse>{
    return await this.projectService.editChoiceStatus(choiceId, updatechoiceDto)
  }

  @Get("testMail")
  async testMail(): Promise<any>{
    return this.projectService.testMail()
  }



  @Post("assignProjectToStudent/:studentId/:projectId")
  async assignProjectToStudent(@Param('studentId') studentId: number, @Param('projectId') projectId: number) : Promise<BaseResponse>{
    return this.projectService.assignProjectToStudent(studentId, projectId)
  }

  @Put("rateStatementOfInterest/:choiceId")
  async rateStatement(@Param('choiceId') choiceId: number, @Body() dto: RateStatement): Promise<BaseResponse>{
    return this.projectService.rateStatementOfInterest(choiceId, dto);
  }

  @Post("requestAdminInput")
  async requestAdminInput(@Body() dto: CreateAdminInputDto) : Promise<BaseResponse>{
    return this.projectService.createAdminInputRequest(dto);
  }

  @Put("addAdminComments/:requestId")
  async addAdminComments(@Param('requestId') requestId: number, @Body() comment: string): Promise<BaseResponse>{
    return this.projectService.addAdminComments(requestId, comment)
  }

  @Get("getAdminInputRequest/:requestId")
  async getAminInputRequest(@Param('requestId') requestId: number): Promise<BaseResponse>{
    return await this.projectService.getAdminInputRequest(requestId);
  }
  
}
