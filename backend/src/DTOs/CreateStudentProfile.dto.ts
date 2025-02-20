import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString } from 'class-validator';
import { Role } from 'src/entities/role.enum';

export class CreateStudentProfileDto {
  @IsString()
  @ApiProperty({
    example: 'JohnDoe@gmail.com',
    description: "user's valid email",
    required: true,
  })
  email: string;

  @IsString()
  @ApiProperty({
    example: '*******',
    description: "user's valid password",
    required: true,
  })
  password1: string;

  @IsString()
  @ApiProperty({
    example: '*******',
    description: 'same as password1',
    required: true,
  })
  password2: string;

  @IsString()
  @ApiProperty({
    example: 'John Doe',
    description: "user's full name",
    required: true,
  })
  name: string;

  @ApiProperty({
    example: 'student',
    description: 'user role either student, tutor or admin',
    required: true,
  })
  role: Role;

  @IsNumber()
  @ApiProperty({
    example: '3',
    description: '1,2 or 3',
    required: true,
  })
  yearOfStudy: number;

  @IsArray()
  @ApiProperty({
    description: 'previous module ids',
    example: [1, 2],
    required: false,
    isArray: true,
  })
  previousModules: number[];

  @ApiProperty({
    example: 'Computer Science',
    required: true,
  })
  department: String;

  @ApiProperty({
    example: '70',
    required: true,
  })
  currentAverage: number;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Student intersts',
    example: ['machine learning', 'data science'],
    required: false,
    isArray: true,
    type: String,
  })
  interests: string[];
}
