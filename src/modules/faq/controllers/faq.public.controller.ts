import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { PublicRoute } from 'src/common/request/decorators/request.public.decorator';

import { FaqCategoryResponseDto } from '../dtos/response/faq.response';
import { FaqService } from '../services/faq.service';

@ApiTags('public.faq')
@Controller({ path: '/faq', version: '1' })
export class FaqPublicController {
    constructor(private readonly faqService: FaqService) {}

    @Get()
    @PublicRoute()
    @ApiOperation({ summary: 'List public FAQ categories' })
    @DocResponse({
        serialization: FaqCategoryResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'faq.success.list',
    })
    async getPublic(): Promise<FaqCategoryResponseDto[]> {
        return this.faqService.listPublic();
    }
}
