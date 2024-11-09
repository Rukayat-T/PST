import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
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

  @IsString()
  @ApiProperty({
    example: 'AI',
    description: 'modules',
  })
  modules: string;
}
