import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiConsumes,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { VouchCreateDto } from '../dtos/request/vouch.create.request';
import { VouchDropClaimCreateDto } from '../dtos/request/vouch.drop-claim.create.request';
import { VouchListQueryDto } from '../dtos/request/vouch.list.query';
import { VouchDropClaimResponseDto } from '../dtos/response/vouch.drop-claim.response';
import { VouchResponseDto } from '../dtos/response/vouch.response';
import { VouchService } from '../services/vouch.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@ApiTags('user.vouch')
@Controller({
    path: '/vouches',
    version: '1',
})
export class VouchUserController {
    constructor(private readonly vouchService: VouchService) {}

    @Post()
    @ApiBearerAuth('accessToken')
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Create vouch for delivered order item' })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: MAX_FILE_SIZE },
        })
    )
    @DocResponse({
        serialization: VouchResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'vouch.success.created',
    })
    public async create(
        @AuthUser() user: IAuthUser,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: VouchCreateDto
    ): Promise<VouchResponseDto> {
        if (!file) {
            throw new BadRequestException('vouch.error.fileRequired');
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException('vouch.error.invalidFileType');
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException('vouch.error.fileTooLarge');
        }
        return this.vouchService.create(user.userId, dto, file);
    }

    @Get('/me')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List own vouches' })
    @DocPaginatedResponse({
        serialization: VouchResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'vouch.success.list',
    })
    public async listMine(
        @AuthUser() user: IAuthUser,
        @Query(new QueryTransformPipe()) query: VouchListQueryDto
    ): Promise<ApiPaginatedDataDto<VouchResponseDto>> {
        return this.vouchService.listMine(user.userId, query);
    }

    @Delete(':id')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Delete own vouch (soft delete)' })
    @HttpCode(HttpStatus.NO_CONTENT)
    public async delete(
        @AuthUser() user: IAuthUser,
        @Param('id') id: string
    ): Promise<void> {
        await this.vouchService.deleteMine(user.userId, id);
    }

    @Post('drop-claim')
    @ApiBearerAuth('accessToken')
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Create vouch for own drop claim' })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: MAX_FILE_SIZE },
        })
    )
    @DocResponse({
        serialization: VouchDropClaimResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'vouch.success.created',
    })
    public async createForDropClaim(
        @AuthUser() user: IAuthUser,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: VouchDropClaimCreateDto
    ): Promise<VouchDropClaimResponseDto> {
        if (!file) {
            throw new BadRequestException('vouch.error.fileRequired');
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException('vouch.error.invalidFileType');
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException('vouch.error.fileTooLarge');
        }
        return this.vouchService.createForDropClaim(user.userId, dto, file);
    }

    @Delete('drop-claim/:id')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Delete own drop-claim vouch (soft delete)' })
    @HttpCode(HttpStatus.NO_CONTENT)
    public async deleteForDropClaim(
        @AuthUser() user: IAuthUser,
        @Param('id') id: string
    ): Promise<void> {
        await this.vouchService.deleteMineDropClaim(user.userId, id);
    }
}
