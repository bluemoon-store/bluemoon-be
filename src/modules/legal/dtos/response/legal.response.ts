import { ApiProperty } from '@nestjs/swagger';
import { ContentType } from '@prisma/client';

export class LegalResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: ContentType })
    type: ContentType;

    @ApiProperty()
    key: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    content: string;

    @ApiProperty()
    updatedAt: Date;
}
