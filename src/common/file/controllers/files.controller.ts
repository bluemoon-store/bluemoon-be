import {
    Controller,
    HttpStatus,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';

import { FilePresignDto } from '../dtos/request/file.presign.dto';
import { FileUploadDto } from '../dtos/request/file.upload.dto';
import {
    FilePutPresignResponseDto,
    FileUploadResponseDto,
} from '../dtos/response/file.response.dto';
import { FileService } from '../services/files.service';

@ApiTags('public.file')
@Controller({
    path: '/file',
    version: '1',
})
export class FilePublicController {
    constructor(private readonly fileService: FileService) {}

    @Post('get-presign')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get pre-signed URL for file upload' })
    @DocResponse({
        serialization: FilePutPresignResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'file.success.presignUrl',
    })
    putPresignUrl(
        @AuthUser() { userId }: IAuthUser,
        @Query() params: FilePresignDto
    ): Promise<FilePutPresignResponseDto> {
        return this.fileService.getPresignUrlPutObject(userId, params);
    }

    @Post('upload')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Upload file directly to S3' })
    @ApiConsumes('multipart/form-data')
    @ApiQuery({
        name: 'storeType',
        enum: ['energy-map-images'],
        description: 'Type of storage location for the file',
        required: true,
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File to upload',
                },
            },
            required: ['file'],
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    @DocResponse({
        serialization: FileUploadResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'file.success.uploaded',
    })
    uploadFile(
        @AuthUser() { userId }: IAuthUser,
        @UploadedFile() file: Express.Multer.File,
        @Query() { storeType }: FileUploadDto
    ): Promise<FileUploadResponseDto> {
        return this.fileService.uploadFile(userId, file, storeType);
    }
}
