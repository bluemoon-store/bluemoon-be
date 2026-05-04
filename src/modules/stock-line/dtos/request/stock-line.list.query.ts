import { ApiPropertyOptional } from '@nestjs/swagger';
import { StockLineStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class StockLineListQueryDto {
    @ApiPropertyOptional({ enum: StockLineStatus })
    @IsOptional()
    @IsEnum(StockLineStatus)
    status?: StockLineStatus;

    @ApiPropertyOptional({ description: 'Substring match on line content' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    search?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number = 50;
}
