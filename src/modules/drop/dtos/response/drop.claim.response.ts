import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsString } from 'class-validator';

export class DropClaimResponseDto {
    @ApiProperty()
    @Expose()
    @IsString()
    claimedContent: string;

    @ApiProperty()
    @Expose()
    @IsString()
    productSlug: string;

    @ApiProperty()
    @Expose()
    @IsString()
    productId: string;

    @ApiProperty()
    @Expose()
    @IsString()
    variantLabel: string;

    @ApiProperty()
    @Expose()
    @IsString()
    dashboardPath: string;
}

export class MyDropClaimResponseDto {
    @ApiProperty()
    @Expose()
    @IsString()
    claimId: string;

    @ApiProperty()
    @Expose()
    @IsString()
    dropId: string;

    @ApiProperty()
    @Expose()
    @IsString()
    productName: string;

    @ApiProperty()
    @Expose()
    @IsString()
    productSlug: string;

    @ApiProperty()
    @Expose()
    @IsString()
    variantLabel: string;

    @ApiProperty()
    @Expose()
    @IsString()
    claimedContent: string;

    @ApiProperty()
    @Expose()
    @IsDate()
    claimedAt: Date;
}
