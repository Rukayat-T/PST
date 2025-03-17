import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { ChoiceStatus } from 'src/util/ChoiceStatus.enum';
import { ProjectStatus } from 'src/util/ProjectStatus.enum';

export class RateStatement {

@ApiProperty({
      example: '8',
      description: "statement of interest score, 0-10",
      required: true,
      maximum: 10,
      minimum: 0
    })
    score: number
}