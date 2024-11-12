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
import { ChosenProject } from './ChosenProject';
import { ModulesEntity } from './Modules';

@Entity('project_entity')
export class ProjectEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => TutorProfile, (tutor) => tutor.projects)
  tutor: TutorProfile;

  @OneToMany(() => StudentProfile, (student) => student.assignedProject, {
    nullable: true,
  })
  assignedStudents: StudentProfile[];

  @Column({ unique: true })
  title: string;

  @OneToMany(() => ChosenProject, (chosenProject) => chosenProject.project)
  chosenProjects: ChosenProject[];

  @OneToMany(() => ModulesEntity, (module) => module.project)
  prerequisiteModules: ModulesEntity[];

  // Many students can choose the same project and a student can choose many projects
  @ManyToMany(() => StudentProfile)
  @JoinTable()
  chosenByStudents: StudentProfile[];

  @Column('text')
  description: string;

  @Column({ nullable: true })
  expectedDeliverable: string;

  @Column('text', { array: true, nullable: true })
  tags: string[]; // array cause can have multiple

  @Column('text', { array: true, nullable: true })
  resources: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
