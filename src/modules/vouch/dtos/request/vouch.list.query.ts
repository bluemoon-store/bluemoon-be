import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export enum VouchSort {
    NEWEST = 'newest',
    OLDEST = 'oldest',
}

export class VouchListQueryDto {
    @ApiPropertyOptional({ example: 1, type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ example: 10, type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional({ enum: VouchSort, example: VouchSort.NEWEST })
    @IsOptional()
    @IsEnum(VouchSort)
    sort?: VouchSort;
}
