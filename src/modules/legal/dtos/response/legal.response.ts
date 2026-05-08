import { ApiProperty } from '@nestjs/swagger';
import { ContentType } from '@prisma/client';
import { Expose } from 'class-transformer';

export class LegalResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty({ enum: ContentType })
    @Expose()
    type: ContentType;

    @ApiProperty()
    @Expose()
    key: string;

    @ApiProperty()
    @Expose()
    title: string;

    @ApiProperty()
    @Expose()
    content: string;

    @ApiProperty()
    @Expose()
    updatedAt: Date;
}
