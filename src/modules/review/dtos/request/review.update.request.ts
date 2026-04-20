import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReviewDto {
    @ApiPropertyOptional({
        description: 'Updated rating score from 1 to 5',
        minimum: 1,
        maximum: 5,
        example: 4,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating?: number;

    @ApiPropertyOptional({
        description: 'Updated review comment',
        example: 'Updated after support resolved my issue quickly.',
    })
    @IsOptional()
    @IsString()
    comment?: string;
}
