import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export enum ReviewSort {
    NEWEST = 'newest',
    OLDEST = 'oldest',
    RATING_HIGH = 'rating_high',
    RATING_LOW = 'rating_low',
}

export class ReviewListQueryDto {
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

    @ApiPropertyOptional({
        enum: ReviewSort,
        example: ReviewSort.NEWEST,
    })
    @IsOptional()
    @IsEnum(ReviewSort)
    sort?: ReviewSort;
}
