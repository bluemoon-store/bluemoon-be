import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';

import { ReviewSort } from './review.list.request';

export class AdminReviewListQueryDto {
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
        description: 'Filter by user id',
        example: '5f4bf8ba-46c4-4ec2-bfc8-40cd834530f8',
    })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiPropertyOptional({
        description: 'Filter by order id',
        example: '5f4bf8ba-46c4-4ec2-bfc8-40cd834530f8',
    })
    @IsOptional()
    @IsUUID()
    orderId?: string;

    @ApiPropertyOptional({ enum: ReviewSort, example: ReviewSort.NEWEST })
    @IsOptional()
    @IsEnum(ReviewSort)
    sort?: ReviewSort;
}
