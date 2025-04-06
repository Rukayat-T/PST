import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/UserEntity.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../DTOs/CreateUserDto.dto';
import { BaseResponse } from 'src/Responses/BaseResponse';
import * as bcrypt from 'bcryptjs';
import { CreateStudentProfileDto } from 'src/DTOs/CreateStudentProfile.dto';
import { CreateTutorProfileDto } from 'src/DTOs/CreateTutorProfile.dto';
import { StudentProfile } from '../entities/StudentProfile.entity';
import { TutorProfile } from 'src/entities/TutorProfile.entity';
import { LoginDto } from 'src/DTOs/LoginDto.dto';
import { response } from 'express';
import { ModulesEntity } from 'src/entities/Modules';
import { Role } from 'src/entities/role.enum';
import { ChosenProject } from 'src/entities/ChosenProject';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(TutorProfile)
    private readonly tutorProfileRepository: Repository<TutorProfile>,
    private jwtService: JwtService,
    @InjectRepository(ModulesEntity)
    private readonly modulesRepository: Repository<ModulesEntity>,
  ) {}

  async getAll(): Promise<any> {
    const users = await this.userRepository.find();

    return users;
  }

  async template(): Promise<BaseResponse> {
    try {
      return {
        status: 201,
        message: 'successful',
        response: '',
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async createStudent(dto: CreateStudentProfileDto): Promise<BaseResponse> {
    try {
      const userFromDb = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (!userFromDb) {
        let user = new UserEntity();
        user.email = dto.email;
        user.name = dto.name;
        user.role = dto.role;

        if (dto.password1 == dto.password2) {
          const hashed = await this.hashPassword(dto.password1);
          user.password = hashed;
          const newUser = await this.userRepository.save(user);

          let previousModules = [];
          for (let i = 0; i < dto.previousModules.length; i++) {
            let module = await this.modulesRepository.findOne({
              where: { id: dto.previousModules[i] },
            });
            previousModules.push(module);
          }

          if (user.role == 'student') {
            let newStudent = new StudentProfile();
            newStudent.user = newUser;
            newStudent.previousModules = previousModules;
            newStudent.department = dto.department;
            newStudent.currentAverage = dto.currentAverage;
            newStudent.interests = dto.interests;
            newStudent.yearOfStudy = dto.yearOfStudy;
            const student = await this.studentProfileRepository.save(
              newStudent,
            );
            return {
              status: 201,
              message: 'new student created',
              response: student,
            };
          }
          return {
            status: 400,
            message: 'Role should be student',
            response: newUser,
          };
        }
        return {
          status: 400,
          message: "passwords don't match",
        };
      }
      return {
        status: 400,
        message: 'user already exists',
      };
    } catch (error) {
      console.log(error);
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  async createTutor(dto: CreateTutorProfileDto): Promise<BaseResponse> {
    try {
      const userFromDb = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (!userFromDb) {
        let user = new UserEntity();
        user.email = dto.email;
        user.name = dto.name;
        user.role = dto.role;

        if (dto.password1 == dto.password2) {
          const hashed = await this.hashPassword(dto.password1);
          user.password = hashed;
          const newUser = await this.userRepository.save(user);

          if (user.role == 'tutor' || user.role == 'admin') {
            let newTutor = new TutorProfile();
            newTutor.user = newUser;
            newTutor.specializations = dto.specializations;
            const tutor = await this.tutorProfileRepository.save(newTutor);
            return {
              status: 201,
              message: 'new tutor created',
              response: tutor,
            };
          }

          return {
            status: 400,
            message: 'Role should be tutor',
            response: newUser,
          };
        }
        return {
          status: 400,
          message: "passwords don't match",
        };
      }
      return {
        status: 400,
        message: 'user already exists',
      };
    } catch (error) {
      console.log(error);
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  async createAdmin(dto: CreateTutorProfileDto): Promise<BaseResponse> {
    try {
      const userFromDb = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (!userFromDb) {
        let user = new UserEntity();
        user.email = dto.email;
        user.name = dto.name;
        user.role = dto.role;

        if (dto.password1 == dto.password2) {
          const hashed = await this.hashPassword(dto.password1);
          user.password = hashed;
          const newUser = await this.userRepository.save(user);

          if (user.role == 'tutor' || user.role == 'admin') {
            let newTutor = new TutorProfile();
            newTutor.user = newUser;
            newTutor.specializations = dto.specializations;
            newTutor.isAdmin = true
            const tutor = await this.tutorProfileRepository.save(newTutor);
            return {
              status: 201,
              message: 'new admin created',
              response: tutor,
            };
          }

          return {
            status: 400,
            message: 'Role should be tutor',
            response: newUser,
          };
        }
        return {
          status: 400,
          message: "passwords don't match",
        };
      }
      return {
        status: 400,
        message: 'user already exists',
      };
    } catch (error) {
      console.log(error);
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // get student
  async getStudent(studentId: number): Promise<BaseResponse> {
    try {
      const student = await this.studentProfileRepository.findOne({
        where: { id: studentId },
      });
      if (!student) {
        return {
          status: 404,
          message: 'student not found',
        };
      }
      return {
        status: 201,
        message: 'successful',
        response: student,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // get tutor
  async getTutor(tutorId: number): Promise<BaseResponse> {
    try {
      const tutor = await this.tutorProfileRepository.findOne({
        where: { id: tutorId },
      });
      if (!tutor) {
        return {
          status: 404,
          message: 'tutor not found',
        };
      }
      return {
        status: 201,
        message: 'successful',
        response: tutor,
      };
      return {
        status: 201,
        message: 'successful',
        response: '',
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // get student profile by user id
  async getStudentProfileByUserId(userId: number): Promise<BaseResponse> {
    try {
      const student = await this.studentProfileRepository.findOne({
        where: {
          user: { id: userId },
        },
      });
      if (!student) {
        return {
          status: 404,
          message: 'student profile not found',
        };
      }
      return {
        status: 201,
        message: 'successful',
        response: student,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  // get tutor profile by user id
  async getTutorProfileByUserId(userId: number): Promise<BaseResponse> {
    try {
      const tutor = await this.tutorProfileRepository.findOne({
        where: {
          user: { id: userId },
        },
      });
      if (!tutor) {
        return {
          status: 404,
          message: 'tutor profile not found',
        };
      }
      return {
        status: 201,
        message: 'successful',
        response: tutor,
      };
    } catch (error) {
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }

  async validateUserPassword(password: string, user: UserEntity): Promise<any> {
    if (user) {
      return await bcrypt.compare(password, user.password);
    }
  }

  async login(dto: LoginDto): Promise<any> {
    try {
      const findUser = await this.userRepository.findOne({
        where: { email: dto.email },
        relations: {
          tutorProfile: true,
          studentProfile: true,
        },
      });

      if (findUser) {
        const validate = await this.validateUserPassword(
          dto.password,
          findUser,
        );
        if (validate == true) {
          if (findUser.role == Role.TUTOR){
            const user = {
              id: findUser.id,
              name: findUser.name,
              email: findUser.email,
              role: findUser.role,
              profileId: findUser.studentProfile
                ? findUser.studentProfile.id
                : findUser.tutorProfile.id,
              isAdmin: findUser.tutorProfile.isAdmin
            };
            const token = await this.jwtService.signAsync({ user });
          return {
            token: token,
          };
          }
          else{
            const user = {
              id: findUser.id,
              name: findUser.name,
              email: findUser.email,
              role: findUser.role,
              profileId: findUser.studentProfile
                ? findUser.studentProfile.id
                : findUser.tutorProfile.id,
            };
            const token = await this.jwtService.signAsync({ user });
          return {
            token: token,
          };
          }
        } else {
          return {
            status: 400,
            message: 'password is incorrect',
          };
        }
      }
      return {
        status: 400,
        message: 'email is incorrect',
      };
    } catch (error) {
      console.log(error);
      return {
        status: 500,
        message: 'bad request',
        response: error.message,
      };
    }
  }

  async getAllTutors(): Promise<BaseResponse> {
    try {
      const tutors = await this.tutorProfileRepository.find();
      return {
        status: 201,
        message: 'Tutors found',
        response: tutors,
      };
    } catch (error) {
      console.log(error);
      return {
        status: 500,
        message: 'bad request',
        response: error.message,
      };
    }
  }

  async getAllAdmins(): Promise<BaseResponse> {
    try {
      const tutors = await this.tutorProfileRepository.find({
        where:{
          isAdmin: true
        }
    });
      return {
        status: 201,
        message: 'Tutors found',
        response: tutors,
      };
    } catch (error) {
      console.log(error);
      return {
        status: 500,
        message: 'bad request',
        response: error.message,
      };
    }
  }

  async getAllStudentFilter(filters: any): Promise<BaseResponse> {
    const {
      search,
      page = 1,
      limit = 15,
    } = filters;

    try {
      const query = this.studentProfileRepository
      .createQueryBuilder("student")
      .leftJoinAndSelect("student.user", "user")
      .leftJoinAndSelect("student.assignedProject", "assignedProject")

      if (search != undefined) {
        query.andWhere('user.name ILIKE :search OR user.email ILIKE :search', {
          search: `%${search}%`,
        });
      }

      const offset = (page - 1) * limit;
      query.offset(offset).limit(limit);

      const students= await query.getRawMany();
      console.log(students)

      const totalCount = await query.getCount();
      const totalPages = Math.ceil(Number(totalCount) / limit);

      // const [sql, parameters] = query.getQueryAndParameters();
    // console.log('Generated SQL Query:', sql);
    // console.log('Parameters:', parameters);

      const result = students.map((student) => ({
        id: student.id,
        name: student.user_name,
        email: student.user_email,
        hasAssignedProject: !!student.assignedProject,
        assignedProjectTitle: student.assignedProject?.title || null,
        yearOfStudy: student.yearOfStudy,
        department: student.department,
      }));

      return {
        status: 201,
        message: 'successful',
        response: {
          students: result,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
          },
        },
      };
    } catch (error) {
      console.log(error)
      return {
        status: 400,
        message: 'Bad Request',
        response: error,
      };
    }
  }
}
