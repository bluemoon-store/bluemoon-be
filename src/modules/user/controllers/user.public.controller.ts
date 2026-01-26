import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Post,
    Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocGenericResponse } from 'src/common/doc/decorators/doc.generic.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';

import { ReferralCodeVerifyDto } from '../dtos/request/referral-code.verify.request';
import { UserUpdateDto } from '../dtos/request/user.update.request';
import {
    UserGetProfileResponseDto,
    UserUpdateProfileResponseDto,
} from '../dtos/response/user.response';
import { UserService } from '../services/user.service';
import { PublicRoute } from 'src/common/request/decorators/request.public.decorator';

@ApiTags('public.user')
@Controller({
    path: '/user',
    version: '1',
})
export class UserPublicController {
    constructor(private readonly userService: UserService) {}

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

    @Post('daily')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Claim daily sparks bonus' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'user.success.dailySparksClaimed',
    })
    public async claimDailySparks(
        @AuthUser() user: IAuthUser
    ): Promise<ApiGenericResponseDto> {
        return this.userService.awardDailySparks(user.userId);
    }

    @Post('referral-code/verify')
    @PublicRoute()
    @ApiOperation({ summary: 'Verify referral code' })
    @DocResponse({
        serialization: ApiGenericResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'user.success.referralCodeVerified',
    })
    public async verifyReferralCode(
        @Body() payload: ReferralCodeVerifyDto
    ): Promise<ApiGenericResponseDto> {
        return this.userService.verifyReferralCode(payload);
    }

    @Delete()
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Delete own account' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'user.success.userDeleted',
    })
    public async deleteSelf(
        @AuthUser() user: IAuthUser
    ): Promise<ApiGenericResponseDto> {
        return this.userService.deleteUser(user.userId, user.userId, user.role);
    }
}
