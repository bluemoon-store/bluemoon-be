import { ApiProperty } from '@nestjs/swagger';

export class StockLineSummaryResponseDto {
    @ApiProperty()
    available: number;

    @ApiProperty()
    reserved: number;

    @ApiProperty()
    sold: number;

    @ApiProperty()
    refunded: number;

    @ApiProperty()
    total: number;
}
