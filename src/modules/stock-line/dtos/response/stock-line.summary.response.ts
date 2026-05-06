import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt } from 'class-validator';

export class StockLineSummaryResponseDto {
    @ApiProperty()
    @Expose()
    @IsInt()
    available: number;

    @ApiProperty()
    @Expose()
    @IsInt()
    reserved: number;

    @ApiProperty()
    @Expose()
    @IsInt()
    sold: number;

    @ApiProperty()
    @Expose()
    @IsInt()
    refunded: number;

    @ApiProperty()
    @Expose()
    @IsInt()
    total: number;
}
