import { PartialType } from '@nestjs/swagger';

import { FaqCreateItemRequestDto } from './faq.create-item.request';

export class FaqUpdateItemRequestDto extends PartialType(
    FaqCreateItemRequestDto
) {}
