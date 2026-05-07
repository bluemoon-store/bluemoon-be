import { Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { PublicRoute } from 'src/common/request/decorators/request.public.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';

import {
    DropClaimResponseDto,
    MyDropClaimResponseDto,
} from '../dtos/response/drop.claim.response';
import { DropPublicResponseDto } from '../dtos/response/drop.public.response';
import { DropService } from '../services/drop.service';

@ApiTags('public.drop')
@Controller({
    path: '/drops',
    version: '1',
})
export class DropPublicController {
    constructor(private readonly dropService: DropService) {}

    @Get()
    @PublicRoute()
    @ApiOperation({ summary: 'List live drops' })
    @DocResponse({
        serialization: DropPublicResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'drop.success.list',
    })
    async list(): Promise<DropPublicResponseDto[]> {
        return this.dropService.listPublicLiveDrops();
    }

    @Post(':id/claim')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Claim one free drop item' })
    @DocResponse({
        serialization: DropClaimResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'drop.success.claimed',
    })
    async claim(
        @AuthUser() user: IAuthUser,
        @Param('id') id: string
    ): Promise<DropClaimResponseDto> {
        return this.dropService.claim(user.userId, id);
    }

    @Get('me')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List current user drop claims' })
    @DocResponse({
        serialization: MyDropClaimResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'drop.success.claimHistory',
    })
    async myClaims(
        @AuthUser() user: IAuthUser
    ): Promise<MyDropClaimResponseDto[]> {
        return this.dropService.listMyClaims(user.userId);
    }

    @Get('me/:claimId')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get current user drop claim by id' })
    @DocResponse({
        serialization: MyDropClaimResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'drop.success.claimDetail',
    })
    async myClaim(
        @AuthUser() user: IAuthUser,
        @Param('claimId') claimId: string
    ): Promise<MyDropClaimResponseDto> {
        return this.dropService.findMyClaim(user.userId, claimId);
    }
}
