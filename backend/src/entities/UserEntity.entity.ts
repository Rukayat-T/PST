import { Role } from './role.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from '@nestjs/class-transformer';
import { StudentProfile } from './StudentProfile.entity';
import { TutorProfile } from './TutorProfile.entity';

@Entity({ name: 'user' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  // @Exclude()
  password: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: Role, default: Role.STUDENT })
  role: Role;

  // Automatically set the date when the record is created
  @CreateDateColumn()
  created_at: Date;

  // Automatically update the date when the record is updated
  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => StudentProfile, (studentProfile) => studentProfile.user)
  studentProfile: StudentProfile;

  @OneToOne(() => TutorProfile, (tutorProfile) => tutorProfile.user)
  tutorProfile: TutorProfile;
}
