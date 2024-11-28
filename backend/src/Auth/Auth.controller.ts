import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthService } from './Auth.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BaseResponse } from 'src/Responses/BaseResponse';
import { CreateUserDto } from 'src/DTOs/CreateUserDto.dto';
import { CreateStudentProfileDto } from 'src/DTOs/CreateStudentProfile.dto';
import { CreateTutorProfileDto } from 'src/DTOs/CreateTutorProfile.dto';
import { LoginDto } from 'src/DTOs/LoginDto.dto';

@ApiBearerAuth()
@ApiTags('Authentication Controller')
@Controller('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('all')
  getHello(): Promise<any> {
    return this.authService.getAll();
  }

  @Post('createStudentUser')
  async createStudentUser(
    @Body() dto: CreateStudentProfileDto,
  ): Promise<BaseResponse> {
    return await this.authService.createStudent(dto);
  }

  @Post('createTutorUser')
  async createTutorUser(
    @Body() dto: CreateTutorProfileDto,
  ): Promise<BaseResponse> {
    return await this.authService.createTutor(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<any> {
    return await this.authService.login(dto);
  }

  // get student
  @Get('getStudentProfile/:studentId')
  async getStudent(
    @Param('studentId') studentId: number,
  ): Promise<BaseResponse> {
    return await this.authService.getStudent(studentId);
  }

  // get tutor
  @Get('getTutorProfile/:tutorId')
  async getTutor(@Param('tutorId') tutorId: number): Promise<BaseResponse> {
    return await this.authService.getTutor(tutorId);
  }

  // get student profile by user id
  @Get('getStudentProfileByUserId/:userId')
  async getStudentByUserId(
    @Param('userId') userId: number,
  ): Promise<BaseResponse> {
    return await this.authService.getStudentProfileByUserId(userId);
  }

  // get tutor profile by user id
  @Get('getTutorProfileByUserId/:userId')
  async getTutorByUserId(
    @Param('userId') userId: number,
  ): Promise<BaseResponse> {
    return await this.authService.getTutorProfileByUserId(userId);
  }

  @Get('getAllTutors')
  async getAllTutors(): Promise<BaseResponse> {
    return await this.authService.getAlltutors();
  }
}
