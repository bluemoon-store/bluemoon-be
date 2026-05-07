import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { VouchProductDto, VouchUserDto } from './vouch.response';

export class VouchDropClaimResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    dropClaimId: string;

    @ApiPropertyOptional({ nullable: true })
    @Expose()
    imageUrl: string | null;

    @ApiPropertyOptional({ nullable: true })
    @Expose()
    caption: string | null;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty({ type: VouchUserDto })
    @Expose()
    @Type(() => VouchUserDto)
    user: VouchUserDto;

    @ApiProperty({ type: VouchProductDto })
    @Expose()
    @Type(() => VouchProductDto)
    product: VouchProductDto;
}
