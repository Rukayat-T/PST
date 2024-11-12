import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @ApiProperty({
    example: 'E-commerce website',
    description: 'project title',
    required: true,
  })
  title: string;

  @IsString()
  @ApiProperty({
    example: 'description',
    description: 'project description',
    required: true,
  })
  description: string;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: "tutor's id",
    required: true,
  })
  tutorId: number;

  @IsArray()
  @ApiProperty({
    description: 'prerequisite module ids',
    example: [1, 2],
    required: false,
    isArray: true,
  })
  prerequisiteModuleIds: number[];

  @ApiProperty({
    description: 'List of resource URLs related to the project',
    example: ['https://example.com/resource1', 'https://example.com/resource2'],
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  // @IsUrl({}, { each: true })
  resources?: string[];

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Tags related to the project',
    example: ['machine learning', 'data science'],
    required: false,
    isArray: true,
    type: String,
  })
  tags: string[]; // array cause can have multiple

  @IsString()
  @ApiProperty({
    example: 'website',
    description: 'expected deliverable',
    required: true,
  })
  expectedDeliverable: string;
}
