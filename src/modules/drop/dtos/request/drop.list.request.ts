import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';

export enum DropListTab {
    ALL = 'all',
    LIVE = 'live',
    EXPIRED = 'expired',
}

export class DropListQueryDto {
    @ApiPropertyOptional({ example: 1, type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ example: 12, type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number;

    @ApiPropertyOptional({ enum: DropListTab, example: DropListTab.ALL })
    @IsOptional()
    @IsEnum(DropListTab)
    tab?: DropListTab;

    @ApiPropertyOptional({ description: 'Search by product or variant label' })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    query?: string;
}
