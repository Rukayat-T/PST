import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateAdminInputDto {
  @IsNumber()
  @ApiProperty({
    example: '1',
    required: false,
  })
  projectId?: number

  @IsNumber()
  @ApiProperty({
    example: '1',
    required: false,
  })
  proposalId?: number

  @IsNumber()
  @ApiProperty({
    example: '1',
    required: false,
  })
  adminTutorProfileId?: number

  @IsString()
  @ApiProperty({
    example: 'I need a decision made between john and jane',
    required: true,
  })
  tutorComments: string;
}
