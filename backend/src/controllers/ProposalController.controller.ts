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

@ApiBearerAuth()
@ApiTags('Proposal Controller')
@Controller('proposal')
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  // create poposal

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Post('createProposal')
  async createProposal(@Body() dto: CreateProposalDto): Promise<BaseResponse> {
    return await this.proposalService.createProposal(dto);
  }

  // withdraw proposal
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Put('withdrawProposal/:studentId/:proposalId')
  async withdrawProposal(
    @Param('studentId') studentId: number,
    @Param('proposalId') proposalId: number,
  ): Promise<BaseResponse> {
    return await this.proposalService.withdrawProposal(studentId, proposalId);
  }

  // approve proposal
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.TUTOR, Role.ADMIN)
  @Put('approveProposal/:tutorId/:proposalId')
  async approveProposal(
    @Param('tutorId') tutorId: number,
    @Param('proposalId') proposalId: number,
  ): Promise<BaseResponse> {
    return await this.proposalService.approveProposal(tutorId, proposalId);
  }

  // reject proposal
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.TUTOR, Role.ADMIN)
  @Put('rejectProposal/:tutorId/:proposalId')
  async rejectProposal(
    @Param('tutorId') tutorId: number,
    @Param('proposalId') proposalId: number,
  ): Promise<BaseResponse> {
    return await this.proposalService.rejectProposal(tutorId, proposalId);
  }

  //get all student's proposals
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Get('getAllStudentsProposals/:studentId')
  async getStudentProposals(
    @Param('studentId') studentId: number,
  ): Promise<BaseResponse> {
    return await this.proposalService.getAllStudentProposals(studentId);
  }

  //get all tutor's proposals
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Get('getAllTutorsProposals/:tutorId')
  async getTutorsProposals(
    @Param('tutorId') tutorId: number,
  ): Promise<BaseResponse> {
    return await this.proposalService.getAllTutorProposals(tutorId);
  }

  //get proposal
  @UseGuards(JwtGuard)
  @Get('getProposal/:proposalId')
  async getProposal(
    @Param('proposalId') proposalId: number,
  ): Promise<BaseResponse> {
    return await this.proposalService.getProposal(proposalId);
  }
}
