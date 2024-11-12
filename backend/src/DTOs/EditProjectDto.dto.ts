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

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'deep_learning',
    description: 'project tags',
  })
  tags?: string[];

  @IsString()
  @ApiProperty({
    example: 'website',
    description: 'expected deliverable',
    required: false,
  })
  expectedDeliverable?: string;
}
