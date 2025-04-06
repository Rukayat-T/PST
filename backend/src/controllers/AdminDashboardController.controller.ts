import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { CreateProposalDto } from 'src/DTOs/CreateProposalDto.dto';
import { Role } from 'src/entities/role.enum';
import { JwtGuard } from 'src/guards/jwt.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { BaseResponse } from 'src/Responses/BaseResponse';
import { AdminDashboardService } from 'src/services/AdminDashboardService.service';
import { ProposalService } from 'src/services/ProposalService.service';
import { TutorDashboardService } from 'src/services/TutorDashboardService.service';

@ApiBearerAuth()
@ApiTags('Admin Dashboard Controller')
@Controller('adminDashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('getMetrics/:adminId')
  async getMetrics(@Param('adminId') adminId: number): Promise<BaseResponse> {
    return await this.adminDashboardService.getMetrics(adminId);
  }

  @Get('getPopularProjects')
  async getPopularProjects(
  ): Promise<BaseResponse> {
    return await this.adminDashboardService.getPopularProjects();
  }

  @Get('application_count-by-week')
  async getApplicationsCountByWeek(): Promise<BaseResponse> {
    return this.adminDashboardService.getApplicationsCountByWeek();
  }

  @Get('getAllocationDistribution')
  async getAllocationDistribution(): Promise<BaseResponse> {
    return this.adminDashboardService.getAllocationDistribution();
  }

}
