import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TutorProfile } from './TutorProfile.entity';
import { ProjectEntity } from './Project.entity';
import { Exclude } from '@nestjs/class-transformer';
import { StudentProfile } from './StudentProfile.entity';
import { ActionType } from 'src/util/ActionType.enum';
import { ProposalEntity } from './Proposal.entity';

@Entity('admin_input_request_entity')
export class AdminInputRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TutorProfile, { nullable: true, onDelete: 'CASCADE' })
  admin: TutorProfile

  @OneToOne(() => ProjectEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  project?: ProjectEntity;

  @ManyToOne(() => ProposalEntity, { nullable: true, onDelete: 'SET NULL' })
  proposal?: ProposalEntity;

  @Column()
  tutorComments: string

  @Column({nullable: true})
  adminComments: string

  @CreateDateColumn()
  createdAt: Date;
}