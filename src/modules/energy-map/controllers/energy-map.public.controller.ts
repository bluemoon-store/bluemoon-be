import { Controller, Post, Get, Body, Param, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { EnergyMapService } from '../services/energy-map.service';
import { CreateEnergyMapDto } from '../dtos/request/energy-map-create.request';
import { EnergyMapResponseDto } from '../dtos/response/energy-map.response';

@ApiTags('public.energy-map')
@Controller({
    path: '/energy-maps',
    version: '1',
})
export class EnergyMapController {
    constructor(private readonly energyMapService: EnergyMapService) {}

    @Post()
    @ApiBearerAuth('accessToken')
    @ApiOperation({
        summary: 'Create a new energy map',
    })
    @DocResponse({
        serialization: EnergyMapResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'energy-map.success.created',
    })
    async createEnergyMap(
        @AuthUser() user: IAuthUser,
        @Body() createDto: CreateEnergyMapDto
    ): Promise<EnergyMapResponseDto> {
        return this.energyMapService.createEnergyMap(user.userId, createDto);
    }

    @Get(':id')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get a specific energy map' })
    @DocResponse({
        serialization: EnergyMapResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'energy-map.success.retrieved',
    })
    async getEnergyMap(
        @AuthUser() user: IAuthUser,
        @Param('id') energyMapId: string
    ): Promise<EnergyMapResponseDto> {
        return this.energyMapService.getEnergyMap(user.userId, energyMapId);
    }

    @Get()
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get all energy maps for the current user' })
    @DocResponse({
        serialization: EnergyMapResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'energy-map.success.list',
    })
    async getUserEnergyMaps(
        @AuthUser() user: IAuthUser
    ): Promise<EnergyMapResponseDto[]> {
        return this.energyMapService.getUserEnergyMaps(user.userId);
    }
}
