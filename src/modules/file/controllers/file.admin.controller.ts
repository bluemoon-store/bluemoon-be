import {
    BadRequestException,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
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

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { FileService } from 'src/common/file/services/files.service';
import { STAFF_OPERATIONS_ROLES } from 'src/common/request/constants/roles.constant';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';

import { AdminFileUploadResponseDto } from '../dtos/response/file-upload.response.dto';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
];

@ApiTags('admin.file')
@Controller({
    path: '/admin/files',
    version: '1',
})
export class FileAdminController {
    constructor(private readonly fileService: FileService) {}

    @Post('upload')
    @HttpCode(HttpStatus.CREATED)
    @AllowedRoles(STAFF_OPERATIONS_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: 'Upload file to public assets storage (returns public URL)',
    })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: MAX_FILE_SIZE },
        })
    )
    @DocResponse({
        serialization: AdminFileUploadResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'file.success.uploaded',
    })
    public async upload(
        @AuthUser() user: IAuthUser,
        @UploadedFile() file: Express.Multer.File
    ): Promise<AdminFileUploadResponseDto> {
        if (!file) {
            throw new BadRequestException('file.error.fileRequired');
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException('file.error.invalidFileType');
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException('file.error.fileTooLarge');
        }

        return this.fileService.uploadPublicAsset(user.userId, file);
    }
}
