import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocGenericResponse } from 'src/common/doc/decorators/doc.generic.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { PublicRoute } from 'src/common/request/decorators/request.public.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { JwtAccessGuard } from 'src/common/request/guards/jwt.access.guard';
import { JwtRefreshGuard } from 'src/common/request/guards/jwt.refresh.guard';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';

import { UserLoginDto } from '../dtos/request/auth.login.dto';
import { UserCreateDto } from '../dtos/request/auth.signup.dto';
import { TwoFactorSetupDto } from '../dtos/request/auth.2fa.setup.dto';
import { TwoFactorVerifyDto } from '../dtos/request/auth.2fa.verify.dto';
import {
    TwoFactorSetupResponseDto,
    TwoFactorVerifyResponseDto,
} from '../dtos/response/auth.2fa.response';
import {
    AuthRefreshResponseDto,
    AuthResponseDto,
} from '../dtos/response/auth.response.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('public.auth')
@Controller({
    version: '1',
    path: '/auth',
})
export class AuthPublicController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @PublicRoute()
    @ApiOperation({ summary: 'User login' })
    @DocResponse({
        serialization: AuthResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.login',
    })
    public login(@Body() payload: UserLoginDto): Promise<AuthResponseDto> {
        return this.authService.login(payload);
    }

    @Post('signup')
    @PublicRoute()
    @ApiOperation({ summary: 'User signup' })
    @DocResponse({
        serialization: AuthResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'auth.success.signup',
    })
    public signup(@Body() payload: UserCreateDto): Promise<AuthResponseDto> {
        return this.authService.signup(payload);
    }

    @Get('refresh-token')
    @PublicRoute()
    @UseGuards(JwtRefreshGuard)
    @ApiBearerAuth('refreshToken')
    @ApiOperation({ summary: 'Refresh token' })
    @DocResponse({
        serialization: AuthRefreshResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'auth.success.refreshToken',
    })
    public refreshTokens(
        @AuthUser() user: IAuthUser
    ): Promise<AuthRefreshResponseDto> {
        return this.authService.refreshTokens(user);
    }

    @Post('2fa/setup')
    @UseGuards(JwtAccessGuard)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Setup two-factor authentication' })
    @DocResponse({
        serialization: TwoFactorSetupResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.twoFactorSetup',
    })
    public setupTwoFactor(
        @AuthUser() user: IAuthUser,
        @Body() payload: TwoFactorSetupDto
    ): Promise<TwoFactorSetupResponseDto> {
        return this.authService.setupTwoFactor(user.userId, payload);
    }

    @Post('2fa/verify')
    @UseGuards(JwtAccessGuard)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Verify and enable two-factor authentication' })
    @DocResponse({
        serialization: TwoFactorVerifyResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.twoFactorEnabled',
    })
    public verifyTwoFactor(
        @AuthUser() user: IAuthUser,
        @Body() payload: TwoFactorVerifyDto
    ): Promise<TwoFactorVerifyResponseDto> {
        return this.authService.verifyTwoFactor(user.userId, payload);
    }

    @Delete('2fa')
    @UseGuards(JwtAccessGuard)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Disable two-factor authentication' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.twoFactorDisabled',
    })
    public disableTwoFactor(
        @AuthUser() user: IAuthUser,
        @Body() payload: TwoFactorVerifyDto
    ): Promise<{ success: boolean; message: string }> {
        return this.authService.disableTwoFactor(user.userId, payload);
    }
}
