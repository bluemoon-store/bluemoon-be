import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class FaqCreateCategoryRequestDto {
    @ApiProperty()
    @IsString()
    @MaxLength(120)
    name: string;
}

export class FaqUpdateCategoryRequestDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(120)
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    position?: number;
}

export class FaqReorderRequestDto {
    @ApiProperty({ type: [String] })
    @IsArray()
    @IsUUID('4', { each: true })
    orderedIds: string[];
}

export class FaqCreateItemRequestDto {
    @ApiProperty()
    @IsString()
    @MaxLength(300)
    question: string;

    @ApiProperty()
    @IsString()
    answerHtml: string;
}

export class FaqUpdateItemRequestDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(300)
    question?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    answerHtml?: string;
}
