import { ApiPropertyOptional } from '@nestjs/swagger';
import { VouchStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

import { VouchSort } from './vouch.list.query';

export class AdminVouchListQueryDto {
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
        enum: VouchStatus,
        description: 'Omit for all statuses',
    })
    @IsOptional()
    @IsEnum(VouchStatus)
    status?: VouchStatus;

    @ApiPropertyOptional({ enum: VouchSort, example: VouchSort.NEWEST })
    @IsOptional()
    @IsEnum(VouchSort)
    sort?: VouchSort;
}
