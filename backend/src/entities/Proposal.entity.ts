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
import { StudentProfile } from './StudentProfile.entity';
import { ProposalStatus } from 'src/util/ProposalStatus.enum';

@Entity('proposal_entity')
export class ProposalEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  expectedDeliverable: string;

  @Column({
    type: 'enum',
    enum: ProposalStatus,
  })
  status: ProposalStatus;

  @Column('text', { array: true, nullable: true })
  tags: string[];

  @Column('text', { array: true, nullable: true })
  resources: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => StudentProfile, (student) => student.proposals)
  created_by: StudentProfile;

  @ManyToOne(() => TutorProfile, (tutor) => tutor.proposals, {
    onDelete: 'CASCADE',
  })
  tutor: TutorProfile;
}
