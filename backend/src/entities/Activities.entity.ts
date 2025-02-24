import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TutorProfile } from './TutorProfile.entity';
import { ProjectEntity } from './Project.entity';
import { Exclude } from '@nestjs/class-transformer';
import { StudentProfile } from './StudentProfile.entity';
import { ActionType } from 'src/util/ActionType.enum';
import { ProposalEntity } from './Proposal.entity';

@Entity('activity_entity')
export class ActivityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TutorProfile, { nullable: true, onDelete: 'CASCADE' })
  tutor?: TutorProfile

  @ManyToOne(() => StudentProfile, { nullable: true, onDelete: 'CASCADE' })
  student?: StudentProfile;

  @ManyToOne(() => ProjectEntity, { nullable: true, onDelete: 'SET NULL' })
  project?: ProjectEntity;

  @ManyToOne(() => ProposalEntity, { nullable: true, onDelete: 'SET NULL' })
  proposal?: ProposalEntity;

  @Column({
      type: 'enum',
      enum: ActionType,
      nullable: true,
    })
  actionType: ActionType

  @CreateDateColumn()
  createdAt: Date;
}