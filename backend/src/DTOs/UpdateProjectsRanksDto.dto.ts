import { Type } from '@nestjs/class-transformer';
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { ChoiceStatus } from 'src/util/ChoiceStatus.enum';
import { ProjectStatus } from 'src/util/ProjectStatus.enum';


export class Inner {
    @ApiProperty({
        example: 1,
        description: "project ID",
        required: true
    })
    choiceId: number;

    @ApiProperty({
        example: 1,
        description: "project ID",
        required: true
    })
    rank: number
}

@ApiExtraModels(Inner)
export class UpdateProjectsRanks {
    @ApiProperty({
        type: () => Inner,
        isArray: true,
        description: 'List of project ranks to update',
      })
      @Type(() => Inner)
      choices: Inner[];
}
