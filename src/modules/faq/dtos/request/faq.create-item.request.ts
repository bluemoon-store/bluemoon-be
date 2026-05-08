import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class FaqCreateItemRequestDto {
    @ApiProperty({ maxLength: 500 })
    @IsString()
    @MaxLength(500)
    question: string;

    @ApiProperty({ maxLength: 200000 })
    @IsString()
    @MaxLength(200000)
    answerHtml: string;
}
