import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './UserEntity.entity';
import { ProjectEntity } from './Project.entity';
import { ChosenProject } from './ChosenProject';
import { ProposalEntity } from './Proposal.entity';

@Entity('student_profile')
export class StudentProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  project_choices: string;

  @Column()
  modules: string;

  @Column()
  yearOfStudy: number;

  // Automatically set the date when the record is created
  @CreateDateColumn()
  created_at: Date;

  // Automatically update the date when the record is updated
  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => UserEntity, (user) => user.studentProfile, { eager: true })
  @JoinColumn()
  user: UserEntity;

  @OneToMany(() => ChosenProject, (chosenProject) => chosenProject.student, {
    eager: true,
  })
  chosenProjects: ChosenProject[];

  @ManyToOne(() => ProjectEntity, (project) => project.assignedStudents, {
    nullable: true,
  })
  assignedProject: ProjectEntity;

  @OneToMany(() => ProposalEntity, (proposal) => proposal.created_by)
  proposals: ProposalEntity[];
}