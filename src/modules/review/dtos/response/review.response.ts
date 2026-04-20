import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ReviewOrderSummaryDto {
    @ApiProperty({ example: 'Netflix Premium' })
    @Expose()
    brand: string;

    @ApiProperty({ example: 2 })
    @Expose()
    itemCount: number;

    @ApiProperty({ example: '59.99000000' })
    @Expose()
    price: string;

    @ApiProperty({ example: '2026-04-20' })
    @Expose()
    date: string;

    @ApiProperty({ example: '12:35:00' })
    @Expose()
    time: string;

    @ApiProperty({ example: 'USDT_ERC20' })
    @Expose()
    paymentMethod: string;
}

export class ReviewResponseDto {
    @ApiProperty({ example: '58b3f269-b8fc-4f6a-b577-c7fcbac2f6f0' })
    @Expose()
    id: string;

    @ApiProperty({ example: '9975d9d4-b3d2-4e2c-b69a-5093f2382ef4' })
    @Expose()
    orderId: string;

    @ApiProperty({ example: 5 })
    @Expose()
    rating: number;

    @ApiPropertyOptional({
        example: 'Excellent seller, instant delivery.',
        nullable: true,
    })
    @Expose()
    comment: string | null;

    @ApiProperty({ example: '2026-04-20T12:35:10.000Z' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ type: ReviewOrderSummaryDto })
    @Expose()
    @Type(() => ReviewOrderSummaryDto)
    order: ReviewOrderSummaryDto;
}
