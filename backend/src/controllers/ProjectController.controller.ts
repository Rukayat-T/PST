import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { CreateProjectDto } from 'src/DTOs/CreateProject.dto';
import { Role } from 'src/entities/role.enum';
import { JwtGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { BaseResponse } from 'src/Responses/BaseResponse';
import { ProjectService } from 'src/services/ProjectService.service';
import { ChooseProjectDto } from 'src/DTOs/ChooseprojectDto.dto';
import { EditProjectDto } from 'src/DTOs/EditProjectDto.dto';

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
  @Get('getAllProjects')
  async getAllProjects(): Promise<BaseResponse> {
    return await this.projectService.getAllProjects();
  }

  // @UseGuards(JwtGuard)
  @Get('getProjectById/:id')
  async getProjectById(@Param('id') id: number): Promise<BaseResponse> {
    return await this.projectService.getProjectById(id);
  }

  // get projects by tutor id
  // @UseGuards(JwtGuard)
  @Get('getProjectsCreatedByTutor/:tutorId')
  async getProjectsByTutor(
    @Param('tutorId') tutorId: number,
  ): Promise<BaseResponse> {
    return await this.projectService.getProjectByTutor(tutorId);
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
}
