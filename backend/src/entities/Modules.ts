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
import { ProjectEntity } from './Project.entity';

@Entity('module_entity')
export class ModulesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @ManyToMany(() => ProjectEntity, (project) => project.prerequisiteModules)
  projects: ProjectEntity[];
}
