import { ApiProperty } from '@nestjs/swagger';

export class FaqItemResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    categoryId: string;

    @ApiProperty()
    question: string;

    @ApiProperty()
    answerHtml: string;

    @ApiProperty()
    position: number;
}

export class FaqCategoryResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    slug: string;

    @ApiProperty()
    position: number;

    @ApiProperty({ type: [FaqItemResponseDto] })
    items: FaqItemResponseDto[];
}
