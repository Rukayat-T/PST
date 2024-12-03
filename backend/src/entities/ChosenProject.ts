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
import { StudentProfile } from './StudentProfile.entity';

@Entity('chosen_project_entity')
export class ChosenProject {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProjectEntity, (project) => project.chosenProjects, {
    onDelete: 'CASCADE',
    eager: true,
  })
  project: ProjectEntity;

  @ManyToOne(
    () => StudentProfile,
    (studentProfile) => studentProfile.chosenProjects,
  )
  student: StudentProfile;

  @Column()
  rank: number;
}
