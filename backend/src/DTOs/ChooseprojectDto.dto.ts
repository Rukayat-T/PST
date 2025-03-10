import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class ChooseProjectDto {
  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'project id',
    required: true,
  })
  projectId: number;

  @IsNumber()
  @ApiProperty({
    example: '1',
    description: 'project rank',
    required: true,
  })
  rank: number;

  @IsString()
  @ApiProperty({
    example: 'I said what I said',
    description: 'student\'s statement of interest',
    required: false,
  })
  statementOfInterest: string

}
