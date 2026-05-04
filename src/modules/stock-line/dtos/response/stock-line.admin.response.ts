import { ApiProperty } from '@nestjs/swagger';
import { StockLineStatus } from '@prisma/client';

export class StockLineAdminRowDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    content: string;

    @ApiProperty({ enum: StockLineStatus })
    status: StockLineStatus;

    @ApiProperty({ nullable: true })
    orderItemId: string | null;

    @ApiProperty({ nullable: true })
    reservedUntil: Date | null;

    @ApiProperty()
    createdAt: Date;
}

export class StockLineBulkAddResponseDto {
    @ApiProperty()
    added: number;

    @ApiProperty()
    skipped: number;

    @ApiProperty()
    totals: {
        available: number;
        reserved: number;
        sold: number;
        refunded: number;
        total: number;
    };
}

export class StockLineListResponseDto {
    @ApiProperty({ type: [StockLineAdminRowDto] })
    items: StockLineAdminRowDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;
}
