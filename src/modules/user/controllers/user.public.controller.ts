import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Put,
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

import { DocGenericResponse } from 'src/common/doc/decorators/doc.generic.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { FileService } from 'src/common/file/services/files.service';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';

import { DeleteAccountDto } from '../dtos/request/user.delete.request';
import { UserUpdateDto } from '../dtos/request/user.update.request';
import {
    UserGetProfileResponseDto,
    UserUpdateProfileResponseDto,
} from '../dtos/response/user.response';
import { PurchaseHistoryResponseDto } from '../dtos/response/user.purchase-history.response';
import { UserService } from '../services/user.service';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIMES = ['image/jpeg', 'image/png'];

@ApiTags('public.user')
@Controller({
    path: '/user',
    version: '1',
})
export class UserPublicController {
    constructor(
        private readonly userService: UserService,
        private readonly fileService: FileService
    ) {}

    @Get('profile')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get user profile' })
    @DocResponse({
        serialization: UserGetProfileResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'user.success.profile',
    })
    public async getProfile(
        @AuthUser() user: IAuthUser
    ): Promise<UserGetProfileResponseDto> {
        return this.userService.getProfile(user.userId);
    }

    @Put()
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update user' })
    @DocResponse({
        serialization: UserUpdateProfileResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'user.success.updated',
    })
    public async update(
        @AuthUser() user: IAuthUser,
        @Body() payload: UserUpdateDto
    ): Promise<UserUpdateProfileResponseDto> {
        return this.userService.updateUser(user.userId, payload);
    }

    @Post('avatar')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('accessToken')
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload avatar image' })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: MAX_AVATAR_SIZE },
        })
    )
    @DocResponse({
        serialization: UserUpdateProfileResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'user.success.avatarUpdated',
    })
    public async uploadAvatar(
        @AuthUser() user: IAuthUser,
        @UploadedFile() file: Express.Multer.File
    ): Promise<UserUpdateProfileResponseDto> {
        if (!file) {
            throw new BadRequestException('user.error.avatarRequired');
        }
        if (!ALLOWED_AVATAR_MIMES.includes(file.mimetype)) {
            throw new BadRequestException('user.error.invalidAvatarType');
        }
        if (file.size > MAX_AVATAR_SIZE) {
            throw new BadRequestException('user.error.avatarTooLarge');
        }

        const { url } = await this.fileService.uploadPublicAsset(
            user.userId,
            file
        );
        return this.userService.updateAvatar(user.userId, url);
    }

    @Delete('avatar')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Remove avatar image' })
    @DocResponse({
        serialization: UserUpdateProfileResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'user.success.avatarRemoved',
    })
    public async removeAvatar(
        @AuthUser() user: IAuthUser
    ): Promise<UserUpdateProfileResponseDto> {
        return this.userService.updateAvatar(user.userId, null);
    }

    @Delete()
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Delete own account' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'user.success.userDeleted',
    })
    public async deleteSelf(
        @AuthUser() user: IAuthUser,
        @Body() payload: DeleteAccountDto
    ): Promise<ApiGenericResponseDto> {
        return this.userService.deleteUser(
            user.userId,
            user.userId,
            user.role,
            payload.password
        );
    }

    @Get('purchases')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get purchase history' })
    @DocResponse({
        serialization: PurchaseHistoryResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'user.success.purchaseHistory',
    })
    public async getPurchaseHistory(
        @AuthUser() user: IAuthUser
    ): Promise<PurchaseHistoryResponseDto> {
        const orders = await this.userService.getPurchaseHistory(user.userId);
        return { orders };
    }
}
