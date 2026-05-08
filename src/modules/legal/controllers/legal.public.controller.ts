import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { PublicRoute } from 'src/common/request/decorators/request.public.decorator';

import { LegalResponseDto } from '../dtos/response/legal.response';
import { LegalService, LegalType } from '../services/legal.service';

@ApiTags('public.legal')
@Controller({ path: '/legal', version: '1' })
export class LegalPublicController {
    constructor(private readonly legalService: LegalService) {}

    @Get()
    @PublicRoute()
    @ApiOperation({ summary: 'List legal documents' })
    @DocResponse({
        serialization: LegalResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'legal.success.list',
    })
    async list(): Promise<LegalResponseDto[]> {
        return this.legalService.listPublic();
    }

    @Get(':type')
    @PublicRoute()
    @ApiOperation({ summary: 'Get legal document by type' })
    @DocResponse({
        serialization: LegalResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'legal.success.found',
    })
    async getOne(@Param('type') type: LegalType): Promise<LegalResponseDto> {
        return this.legalService.getOnePublic(type);
    }
}
