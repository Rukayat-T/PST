import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @ApiProperty({
    example: 'E-commerce website',
    description: 'project title',
    required: true,
  })
  title: string;

  @IsString()
  @ApiProperty({
    example: 'E-commerce website',
    description: 'project description',
    required: true,
  })
  description: string;

  @IsString()
  @ApiProperty({
    example: 'website',
    description: 'expected deliverable',
    required: true,
  })
  expectedDeliverable: string;

  @ApiProperty({
    description: 'List of resource URLs related to the project',
    example: ['https://example.com/resource1', 'https://example.com/resource2'],
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
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
  tags: string[];

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: "student's id",
    required: true,
  })
  created_by: number;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: "tutor's id",
    required: true,
  })
  proposed_to: number;
}
