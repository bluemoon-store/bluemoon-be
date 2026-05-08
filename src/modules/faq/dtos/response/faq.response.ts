import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class FaqItemResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    categoryId: string;

    @ApiProperty()
    @Expose()
    question: string;

    @ApiProperty()
    @Expose()
    answerHtml: string;

    @ApiProperty()
    @Expose()
    position: number;
}

export class FaqCategoryResponseDto {
    @ApiProperty()
    @Expose()
    id: string;

    @ApiProperty()
    @Expose()
    name: string;

    @ApiProperty()
    @Expose()
    slug: string;

    @ApiProperty()
    @Expose()
    position: number;

    @ApiProperty({ type: [FaqItemResponseDto] })
    @Expose()
    @Type(() => FaqItemResponseDto)
    items: FaqItemResponseDto[];
}
