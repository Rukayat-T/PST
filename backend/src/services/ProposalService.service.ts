import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/Auth/Auth.service';
import { CreateProposalDto } from 'src/DTOs/CreateProposalDto.dto';
import { ActivityEntity } from 'src/entities/Activities.entity';
import { ModulesEntity } from 'src/entities/Modules';
import { ProjectEntity } from 'src/entities/Project.entity';
import { ProposalEntity } from 'src/entities/Proposal.entity';
import { StudentProfile } from 'src/entities/StudentProfile.entity';
import { TutorProfile } from 'src/entities/TutorProfile.entity';
import { MailService } from 'src/Mail/Mail.service';
import { BaseResponse } from 'src/Responses/BaseResponse';
import { ActionType } from 'src/util/ActionType.enum';
import { ProjectStatus } from 'src/util/ProjectStatus.enum';
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
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: Repository<ActivityEntity>,
     @InjectRepository(ProjectEntity)
        private readonly projectRepository: Repository<ProjectEntity>,
    

    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  // create poposal
  async createProposal(dto: CreateProposalDto): Promise<BaseResponse> {
    try {
      let proposal = new ProposalEntity();

      proposal.description = dto.description;
      proposal.statementOfInterest = dto.statementOfInterest
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

      const saved = await this.proposalRepository.save(proposal);
      this.mailService.sendProposalCreationStatusUpdate(proposal, proposal.status)
      this.logActivity(dto.proposed_to, ActionType.PROPOSAL_SUBMITTED, dto.created_by, undefined, saved.id)

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
        relations: ['tutor',"created_by"]
      });
      if (!proposal) {
        return {
          status: 404,
          message: 'proposal not found',
        };
      }
      proposal.status = ProposalStatus.WITHDRAWN;
      await this.proposalRepository.save(proposal);

      this.logActivity(proposal.tutor.id, ActionType.PROPOSAL_WITHDRAWN, studentId, undefined, proposalId )
      this.mailService.sendProposalWithdrawalStatusUpdate(proposal, proposal.status)
      return {
        status: 201,
        message: 'successful',
        response: proposal,
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

      this.mailService.sendProposalApprovalStatusUpdate(proposal, proposal.status)

      this.logActivity(tutorId, ActionType.PROPOSAL_ACCEPTED, proposal.created_by.id, undefined, proposalId )

      let project = new ProjectEntity()
      project.title = proposal.title;
      project.description = proposal.description;
      project.expectedDeliverable = proposal.expectedDeliverable;
      project.tags = proposal.tags;
      project.status = ProjectStatus.ASSIGNED
      project.tutor = proposal.tutor
      project.resources = proposal.resources;
      project.prerequisiteModules = proposal.modules;

      const savedProject = await this.projectRepository.save(project)

      const student = proposal.created_by
      student.assignedProject = savedProject
      this.studentProfileRepository.save(student)

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
      const studentId = proposal.created_by.id
      this.mailService.sendProposalRejectionStatusUpdate(proposal, proposal.status)
      this.logActivity(tutorId, ActionType.PROPOSAL_REJECTED, studentId, undefined, proposalId )
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
          modules: true
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
        relations: ["created_by", "modules"]
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
        relations : ["created_by", "modules"]
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

  async logActivity(
    tutorId: number,
    actionType: ActionType,
    studentId?: number,
    projectId?: number,
    proposalId?: number
  ): Promise<void> {
    const tutor = await this.tutorProfileRepository.findOne({ where: { id: tutorId } });
    if (!tutor) throw new Error('Tutor not found');

    const student = studentId ? await this.studentProfileRepository.findOne({ where: { id: studentId } }) : null;
    if (studentId !== undefined && !student) throw new Error('Student not found');

    const project = null;
    const proposal = proposalId ? await this.proposalRepository.findOne({ where: { id: proposalId } }) : null;
    if (proposalId !== undefined && !proposal) throw new Error('Proposal not found');

    const activity = this.activityRepository.create({
      tutor,
      student,
      project,
      proposal,
      actionType,
    });

    await this.activityRepository.save(activity);
  }
}
