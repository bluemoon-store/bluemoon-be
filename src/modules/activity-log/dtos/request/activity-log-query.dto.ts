import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityLogCategory, ActivityLogSeverity } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class ActivityLogQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsUUID()
    actorId?: string;

    @ApiPropertyOptional({ enum: ActivityLogCategory })
    @IsOptional()
    @IsEnum(ActivityLogCategory)
    category?: ActivityLogCategory;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(256)
    action?: string;

    @ApiPropertyOptional({ enum: ActivityLogSeverity })
    @IsOptional()
    @IsEnum(ActivityLogSeverity)
    severity?: ActivityLogSeverity;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(128)
    resourceType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(128)
    resourceId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiPropertyOptional({
        description: 'Search actor email/name/label/action',
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    q?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiPropertyOptional({ default: 20, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number;
}

/** Placeholder for future actor-list filters */
export class ActivityLogActorsQueryDto {}
