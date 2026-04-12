import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Put,
    Query,
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

import { TwoFactorDisableDto } from '../dtos/request/auth.2fa.disable.dto';
import { TwoFactorSetupDto } from '../dtos/request/auth.2fa.setup.dto';
import { TwoFactorVerifyLoginDto } from '../dtos/request/auth.2fa.verify-login.dto';
import { TwoFactorVerifyDto } from '../dtos/request/auth.2fa.verify.dto';
import { ChangePasswordDto } from '../dtos/request/auth.change-password.dto';
import { ForgotPasswordDto } from '../dtos/request/auth.forgot-password.dto';
import { UserLoginDto } from '../dtos/request/auth.login.dto';
import { ResetPasswordLinkDto } from '../dtos/request/auth.reset-password-link.dto';
import { ResetPasswordDto } from '../dtos/request/auth.reset-password.dto';
import { UserCreateDto } from '../dtos/request/auth.signup.dto';
import { VerifyEmailQueryDto } from '../dtos/request/auth.verify-email.query.dto';
import { VerifyOtpDto } from '../dtos/request/auth.verify-otp.dto';
import {
    TwoFactorSetupResponseDto,
    TwoFactorVerifyResponseDto,
} from '../dtos/response/auth.2fa.response';
import {
    AuthRefreshResponseDto,
    AuthResponseDto,
    AuthSuccessResponseDto,
    LoginResponseSerializerDto,
    TwoFactorChallengeResponseDto,
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
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'User login',
        description:
            'Returns tokens when 2FA is off. When 2FA is on, returns requiresTwoFactor and twoFactorToken; complete login via POST /auth/2fa/verify-login.',
    })
    @DocResponse({
        serialization: LoginResponseSerializerDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.login',
    })
    public login(
        @Body() payload: UserLoginDto
    ): Promise<AuthResponseDto | TwoFactorChallengeResponseDto> {
        return this.authService.login(payload);
    }

    @Post('2fa/verify-login')
    @PublicRoute()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Complete login with TOTP after password step' })
    @DocResponse({
        serialization: AuthResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.login',
    })
    public verifyTwoFactorLogin(
        @Body() payload: TwoFactorVerifyLoginDto
    ): Promise<AuthResponseDto> {
        return this.authService.verifyTwoFactorLogin(payload);
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

    @Post('forgot-password')
    @PublicRoute()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request password reset OTP' })
    @DocResponse({
        serialization: AuthSuccessResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.forgotPassword',
    })
    public forgotPassword(
        @Body() payload: ForgotPasswordDto
    ): Promise<AuthSuccessResponseDto> {
        return this.authService.forgotPassword(payload);
    }

    @Post('forgot-password-link')
    @PublicRoute()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request password reset link (email)' })
    @DocResponse({
        serialization: AuthSuccessResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.forgotPassword',
    })
    public forgotPasswordLink(
        @Body() payload: ForgotPasswordDto
    ): Promise<AuthSuccessResponseDto> {
        return this.authService.forgotPasswordLink(payload);
    }

    @Post('verify-otp')
    @PublicRoute()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify password reset OTP' })
    @DocResponse({
        serialization: AuthSuccessResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.otpVerified',
    })
    public verifyOtp(
        @Body() payload: VerifyOtpDto
    ): Promise<AuthSuccessResponseDto> {
        return this.authService.verifyOtp(payload);
    }

    @Post('reset-password')
    @PublicRoute()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password with OTP' })
    @DocResponse({
        serialization: AuthSuccessResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.passwordReset',
    })
    public resetPassword(
        @Body() payload: ResetPasswordDto
    ): Promise<AuthSuccessResponseDto> {
        return this.authService.resetPassword(payload);
    }

    @Post('reset-password-link')
    @PublicRoute()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password with token from email link' })
    @DocResponse({
        serialization: AuthSuccessResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.passwordReset',
    })
    public resetPasswordLink(
        @Body() payload: ResetPasswordLinkDto
    ): Promise<AuthSuccessResponseDto> {
        return this.authService.resetPasswordLink(payload);
    }

    @Put('change-password')
    @UseGuards(JwtAccessGuard)
    @ApiBearerAuth('accessToken')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Change password (authenticated)' })
    @DocResponse({
        serialization: AuthSuccessResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.passwordChanged',
    })
    public changePassword(
        @AuthUser() user: IAuthUser,
        @Body() payload: ChangePasswordDto
    ): Promise<AuthSuccessResponseDto> {
        return this.authService.changePassword(user.userId, payload);
    }

    @Post('send-verification-email')
    @UseGuards(JwtAccessGuard)
    @ApiBearerAuth('accessToken')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Send email verification link' })
    @DocResponse({
        serialization: AuthSuccessResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.verificationEmailSent',
    })
    public sendVerificationEmail(
        @AuthUser() user: IAuthUser
    ): Promise<AuthSuccessResponseDto> {
        return this.authService.sendVerificationEmail(user.userId);
    }

    @Get('verify-email')
    @PublicRoute()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify email via token from link' })
    @DocResponse({
        serialization: AuthSuccessResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.emailVerified',
    })
    public verifyEmail(
        @Query() query: VerifyEmailQueryDto
    ): Promise<AuthSuccessResponseDto> {
        return this.authService.verifyEmail(query.token);
    }

    @Post('logout')
    @UseGuards(JwtAccessGuard)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'User logout' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'auth.success.logout',
    })
    public logout(): Promise<{ success: boolean; message: string }> {
        return this.authService.logout();
    }

    @Get('refresh-token')
    @PublicRoute()
    @UseGuards(JwtRefreshGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('refreshToken')
    @ApiOperation({ summary: 'Refresh token' })
    @DocResponse({
        serialization: AuthRefreshResponseDto,
        httpStatus: HttpStatus.OK,
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
        @Body() payload: TwoFactorDisableDto
    ): Promise<{ success: boolean; message: string }> {
        return this.authService.disableTwoFactor(user.userId, payload);
    }
}
