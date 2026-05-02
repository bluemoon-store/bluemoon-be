import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Query parameters for listing users (admin)
 */
export class UserListQueryDto {
    @ApiPropertyOptional({
        description: 'Page number',
        example: 1,
        type: Number,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({
        description: 'Items per page',
        example: 10,
        type: Number,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional({
        description:
            'Search email, first name, last name, or username (case-insensitive)',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by banned status' })
    @IsOptional()
    @IsBoolean()
    isBanned?: boolean;

    @ApiPropertyOptional({
        description: 'Filter by verified (non-guest) status',
    })
    @IsOptional()
    @IsBoolean()
    isVerified?: boolean;

    @ApiPropertyOptional({ description: 'Filter by flagged status' })
    @IsOptional()
    @IsBoolean()
    isFlagged?: boolean;
}
