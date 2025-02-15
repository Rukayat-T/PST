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
import { ProposalService } from 'src/services/ProposalService.service';
import { TutorDashboardService } from 'src/services/TutorDashboardService.service';

@ApiBearerAuth()
@ApiTags('Tutor Dashboard Controller')
@Controller('tutorDashboard')
export class TutorDashboardController {
  constructor(private readonly tutorDashboardService: TutorDashboardService) {}

  @Get('getMetrics/:tutorId')
  async getmetrics(@Param('tutorId') tutorId: number): Promise<BaseResponse> {
    return await this.tutorDashboardService.getMetrics(tutorId);
  }
}
