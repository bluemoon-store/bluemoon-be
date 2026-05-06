import { ApiProperty } from '@nestjs/swagger';
import { StockLineStatus } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
    IsDate,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from 'class-validator';

export class StockLineAdminRowDto {
    @ApiProperty()
    @Expose()
    @IsUUID()
    id: string;

    @ApiProperty()
    @Expose()
    @IsString()
    content: string;

    @ApiProperty({ enum: StockLineStatus })
    @Expose()
    @IsEnum(StockLineStatus)
    status: StockLineStatus;

    @ApiProperty({ nullable: true })
    @Expose()
    @IsOptional()
    @IsString()
    orderItemId: string | null;

    @ApiProperty({ nullable: true })
    @Expose()
    @IsOptional()
    @IsDate()
    reservedUntil: Date | null;

    @ApiProperty()
    @Expose()
    @IsDate()
    createdAt: Date;
}

export class StockLineBulkAddTotalsDto {
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

export class StockLineBulkAddResponseDto {
    @ApiProperty()
    @Expose()
    @IsInt()
    added: number;

    @ApiProperty()
    @Expose()
    @IsInt()
    skipped: number;

    @ApiProperty({ type: StockLineBulkAddTotalsDto })
    @Expose()
    @ValidateNested()
    @Type(() => StockLineBulkAddTotalsDto)
    totals: StockLineBulkAddTotalsDto;
}
