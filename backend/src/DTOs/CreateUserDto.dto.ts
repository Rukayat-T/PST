import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../entities/role.enum';

export class CreateUserDto {
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
}
