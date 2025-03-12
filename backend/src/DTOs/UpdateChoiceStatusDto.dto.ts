import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { ChoiceStatus } from 'src/util/ChoiceStatus.enum';
import { ProjectStatus } from 'src/util/ProjectStatus.enum';

export class UpdateChoiceStatusDto {

@ApiProperty({
      example: 'UNDER_REVIEW',
      description: "status of project, can be UNDER_REVIEW, APPLIED, SHORTLISTED, ALLOCATED, NOT_SELECTED, WITHDRAWN",
      required: true
    })
    status: ChoiceStatus;
}