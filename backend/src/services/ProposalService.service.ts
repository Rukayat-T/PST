import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/Auth/Auth.service';
import { CreateProposalDto } from 'src/DTOs/CreateProposalDto.dto';
import { ModulesEntity } from 'src/entities/Modules';
import { ProposalEntity } from 'src/entities/Proposal.entity';
import { StudentProfile } from 'src/entities/StudentProfile.entity';
import { TutorProfile } from 'src/entities/TutorProfile.entity';
import { BaseResponse } from 'src/Responses/BaseResponse';
import { ProposalStatus } from 'src/util/ProposalStatus.enum';
import { Repository, In } from 'typeorm';

@Injectable()
export class ProposalService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(TutorProfile)
    private readonly tutorProfileRepository: Repository<TutorProfile>,
    @InjectRepository(ProposalEntity)
    private readonly proposalRepository: Repository<ProposalEntity>,
    @InjectRepository(ModulesEntity)
    private readonly modulesRepository: Repository<ModulesEntity>,

    private readonly authService: AuthService,
  ) {}

  // create poposal
  async createProposal(dto: CreateProposalDto): Promise<BaseResponse> {
    try {
      let proposal = new ProposalEntity();

      proposal.description = dto.description;
      proposal.expectedDeliverable = dto.expectedDeliverable;
      proposal.resources = dto.resources;
      proposal.status = ProposalStatus.PENDING;
      proposal.tags = dto.tags;
      proposal.title = dto.title;
      proposal.created_by = await this.studentProfileRepository.findOne({
        where: { id: dto.created_by },
      });
      proposal.tutor = await this.tutorProfileRepository.findOne({
        where: { id: dto.proposed_to },
      });

      if (dto.moduleIds && dto.moduleIds.length > 0) {
        proposal.modules = await this.modulesRepository.findBy({
          id: In(dto.moduleIds),
        });
      }

      await this.proposalRepository.save(proposal);

      return {
        status: 201,
        message: 'successful',
        response: proposal,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // withdraw proposal
  async withdrawProposal(
    studentId: number,
    proposalId: number,
  ): Promise<BaseResponse> {
    try {
      const student = (await this.authService.getStudent(studentId)).response;
      if (!student) {
        return {
          status: 404,
          message: 'student not found',
        };
      }
      const proposal = await this.proposalRepository.findOne({
        where: { id: proposalId, created_by: { id: studentId } },
      });
      if (!proposal) {
        return {
          status: 404,
          message: 'proposal not found',
        };
      }
      proposal.status = ProposalStatus.WITHDRAWN;
      await this.proposalRepository.save(proposal);
      return {
        status: 201,
        message: 'successful',
        response: proposal,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // approve proposal
  async approveProposal(
    tutorId: number,
    proposalId: number,
  ): Promise<BaseResponse> {
    try {
      console.log('yopo');
      const tutor = (await this.authService.getTutor(tutorId)).response;
      console.log(tutor);
      if (!tutor) {
        return {
          status: 404,
          message: 'tutor not found',
        };
      }
      const proposal = await this.proposalRepository.findOne({
        where: { id: proposalId, tutor: { id: tutorId } },
      });
      if (!proposal) {
        return {
          status: 404,
          message: 'proposal not found',
        };
      }
      proposal.status = ProposalStatus.APPROVED;
      await this.proposalRepository.save(proposal);
      return {
        status: 201,
        message: 'successful',
        response: proposal,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // reject proposal
  async rejectProposal(
    tutorId: number,
    proposalId: number,
  ): Promise<BaseResponse> {
    try {
      const tutor = (await this.authService.getTutor(tutorId)).response;
      if (!tutor) {
        return {
          status: 404,
          message: 'tutor not found',
        };
      }
      const proposal = await this.proposalRepository.findOne({
        where: { id: proposalId, tutor: { id: tutorId } },
      });
      if (!proposal) {
        return {
          status: 404,
          message: 'proposal not found',
        };
      }
      proposal.status = ProposalStatus.REJECTED;
      await this.proposalRepository.save(proposal);
      return {
        status: 201,
        message: 'successful',
        response: proposal,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  //get all student's proposals
  async getAllStudentProposals(studentId: number): Promise<BaseResponse> {
    try {
      const student = (await this.authService.getStudent(studentId)).response;
      if (!student) {
        return {
          status: 404,
          message: 'student not found',
        };
      }
      const proposals = await this.proposalRepository.find({
        where: { created_by: { id: studentId } },
        relations: {
          tutor: true,
        },
      });
      if (proposals.length != 0) {
        return {
          status: 201,
          message: 'successful',
          response: proposals,
        };
      }
      return {
        status: 404,
        message: 'there are no proposals for this student',
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  //get all tutor's proposals
  async getAllTutorProposals(tutorId: number): Promise<BaseResponse> {
    try {
      const tutor = (await this.authService.getTutor(tutorId)).response;
      if (!tutor) {
        return {
          status: 404,
          message: 'tutor not found',
        };
      }
      const proposals = await this.proposalRepository.find({
        where: { tutor: { id: tutorId } },
      });
      if (proposals.length != 0) {
        return {
          status: 201,
          message: 'successful',
          response: proposals,
        };
      }
      return {
        status: 404,
        message: 'there are no proposals for this tutor',
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  //get proposal
  async getProposal(id: number): Promise<BaseResponse> {
    try {
      const proposal = await this.proposalRepository.findOne({
        where: { id: id },
      });
      if (!proposal) {
        return {
          status: 404,
          message: 'proposal not found',
        };
      }
      return {
        status: 201,
        message: 'successful',
        response: proposal,
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
