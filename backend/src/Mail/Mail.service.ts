import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { JSDOM } from "jsdom";
// import createDOMPurify from "dompurify";
const createDOMPurify = require("dompurify");
import { InjectRepository } from '@nestjs/typeorm';
import { ProposalEntity } from 'src/entities/Proposal.entity';
import { ProposalService } from 'src/services/ProposalService.service';
import { ProposalStatus } from 'src/util/ProposalStatus.enum';
import { Repository } from 'typeorm';
import { ProjectStatus } from 'src/util/ProjectStatus.enum';

const window = new JSDOM("").window; // Create a fake browser window
const DOMPurify = createDOMPurify(window); // Create a DOMPurify instance

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    // private readonly proposalService: ProposalService,
  ) {}

  async sendMail(): Promise<any> {
    try {
      const message = `Hello, testing!! testing!!`;

      await this.mailerService.sendMail({
        from: 'Project Selection Tool <pst092024@gmail.com>',
        to: 'tewogbaderukayat@gmail.com',
        subject: `How to Send Emails with Nodemailer`,
        text: message,
      });

      return 'sent';
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async sendProposalWithdrawalStatusUpdate(proposal: any, status: ProposalStatus): Promise<any> {

    const sanitizedDescription = DOMPurify.sanitize(proposal?.description); // Sanitize HTML
    const maxLength = 100
    const truncatedDescription = sanitizedDescription.length > maxLength
      ? sanitizedDescription.substring(0, maxLength) + "..."
      : sanitizedDescription;

    await this.mailerService.sendMail({
      // to: proposal.tutor.user.email,
      to: "tewogbaderukayat@gmail.com",
      from: 'Project Selection Tool <pst092024@gmail.com>',
      subject: "Proposal Updated",
      template: "./WithdrawProposal",
      context: {
        tutorName: proposal.tutor.user.name,
        proposalName: proposal.title,
        description: truncatedDescription,
        status,
        reviewLink: `http://localhost:3000/Login?redirect=/Tutor/proposals/${proposal.id}/view_proposal`
      },
    })
  }

  async sendProposalApprovalStatusUpdate(proposal: any, status: ProposalStatus): Promise<any> {

    const sanitizedDescription = DOMPurify.sanitize(proposal?.description); // Sanitize HTML
    const maxLength = 100
    const truncatedDescription = sanitizedDescription.length > maxLength
      ? sanitizedDescription.substring(0, maxLength) + "..."
      : sanitizedDescription;

    await this.mailerService.sendMail({
      // to: proposal.tutor.user.email,
      to: "tewogbaderukayat@gmail.com",
      from: 'Project Selection Tool <pst092024@gmail.com>',
      subject: "Proposal Updated",
      template: "./AcceptProposal",
      context: {
        studentName: proposal.created_by.user.name,
        proposalName: proposal.title,
        description: truncatedDescription,
        status,
        reviewLink: `http://localhost:3000/Login?redirect=/Proposals`
      },
    })
  }

  async sendProposalRejectionStatusUpdate(proposal: any, status: ProposalStatus): Promise<any> {

    const sanitizedDescription = DOMPurify.sanitize(proposal?.description); // Sanitize HTML
    const maxLength = 100
    const truncatedDescription = sanitizedDescription.length > maxLength
      ? sanitizedDescription.substring(0, maxLength) + "..."
      : sanitizedDescription;

    await this.mailerService.sendMail({
      // to: proposal.tutor.user.email,
      to: "tewogbaderukayat@gmail.com",
      from: 'Project Selection Tool <pst092024@gmail.com>',
      subject: "Proposal Updated",
      template: "./RejectProposal",
      context: {
        studentName: proposal.created_by.user.name,
        proposalName: proposal.title,
        description: truncatedDescription,
        status,
        reviewLink: `http://localhost:3000/Login?redirect=/Proposals`
      },
    })
  }

  async sendProjectApplicationStatusUpdate(project: any, status: ProjectStatus): Promise<any> {
    const sanitizedDescription = DOMPurify.sanitize(project?.description); // Sanitize HTML
    const maxLength = 100
    const truncatedDescription = sanitizedDescription.length > maxLength
      ? sanitizedDescription.substring(0, maxLength) + "..."
      : sanitizedDescription;

    await this.mailerService.sendMail({
      // to: proposal.tutor.user.email,
      to: "tewogbaderukayat@gmail.com",
      from: 'Project Selection Tool <pst092024@gmail.com>',
      subject: "Project application",
      template: "./ChooseProject",
      context: {
        tutorName: project.tutor.user.name,
        projectName: project.title,
        description: truncatedDescription,
        status,
        reviewLink: `http://localhost:3000/Login?redirect=/Tutor/projects/${project.id}/view_students`
      },
    })
  }

  async sendProposalCreationStatusUpdate(proposal: any, status: ProposalStatus): Promise<any> {

    const sanitizedDescription = DOMPurify.sanitize(proposal?.description); // Sanitize HTML
    const maxLength = 100
    const truncatedDescription = sanitizedDescription.length > maxLength
      ? sanitizedDescription.substring(0, maxLength) + "..."
      : sanitizedDescription;

    await this.mailerService.sendMail({
      // to: proposal.tutor.user.email,
      to: "tewogbaderukayat@gmail.com",
      from: 'Project Selection Tool <pst092024@gmail.com>',
      subject: "Proposal Created",
      template: "./CreateProposal",
      context: {
        tutorName: proposal.tutor.user.name,
        proposalName: proposal.title,
        description: truncatedDescription,
        status,
        reviewLink: `http://localhost:3000/Login?redirect=/Tutor/proposals/${proposal.id}/view_proposal`
      },
    })
  }
  
}