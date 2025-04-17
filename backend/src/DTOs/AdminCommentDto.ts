import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class AdminCommentDto {
  @IsString()
  @ApiProperty({
    example: 'all done',
    required: true,
  })
  comment: string;
}
