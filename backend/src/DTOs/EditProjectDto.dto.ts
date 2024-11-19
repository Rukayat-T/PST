import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class EditProjectDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'E-commerce website',
    description: 'project title',
  })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'E-commerce website',
    description: 'project description',
  })
  description?: string;

  @IsArray()
  @ApiProperty({
    description: 'prerequisite module ids',
    example: [1, 2],
    required: false,
    isArray: true,
  })
  prerequisiteModuleIds?: number[];

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
    required: false,
  })
  expectedDeliverable?: string;
}
