import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './UserEntity.entity';
import { ProjectEntity } from './Project.entity';
import { ProposalEntity } from './Proposal.entity';

@Entity('tutor_profile')
export class TutorProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => ProjectEntity, (project) => project.tutor)
  projects: ProjectEntity[];

  @Column()
  specializations: string;

  // Automatically set the date when the record is created
  @CreateDateColumn()
  created_at: Date;

  // Automatically update the date when the record is updated
  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => UserEntity, (user) => user.tutorProfile, { eager: true })
  @JoinColumn()
  user: UserEntity;

  @OneToMany(() => ProposalEntity, (proposal) => proposal.tutor)
  proposals: ProposalEntity[];
}
