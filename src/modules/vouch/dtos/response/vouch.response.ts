import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class VouchUserDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    userName: string;

    @ApiPropertyOptional({ nullable: true })
    @Expose()
    avatar: string | null;
}

export class VouchProductDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    name: string;

    @ApiProperty()
    @Expose()
    slug: string;

    @ApiPropertyOptional({ nullable: true })
    @Expose()
    imageUrl: string | null;
}

export class VouchResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    orderItemId: string;

    @ApiProperty()
    @Expose()
    imageUrl: string;

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
