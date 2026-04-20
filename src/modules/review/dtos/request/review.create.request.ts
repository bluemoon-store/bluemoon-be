import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateReviewDto {
    @ApiProperty({
        description: 'Order ID to review',
        example: 'd7f19aa4-11f2-4f47-b4ce-c9b6f11f1201',
    })
    @IsUUID()
    orderId: string;

    @ApiProperty({
        description: 'Rating score from 1 to 5',
        minimum: 1,
        maximum: 5,
        example: 5,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({
        description: 'Optional review comment',
        example: 'Fast delivery and smooth purchase.',
    })
    @IsOptional()
    @IsString()
    comment?: string;
}
