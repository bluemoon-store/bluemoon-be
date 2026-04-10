import { IAuthUser } from 'src/common/request/interfaces/request.interface';

import { UserLoginDto } from '../dtos/request/auth.login.dto';
import {
    AuthRefreshResponseDto,
    AuthResponseDto,
} from '../dtos/response/auth.response.dto';
import { UserCreateDto } from '../dtos/request/auth.signup.dto';
import { TwoFactorSetupDto } from '../dtos/request/auth.2fa.setup.dto';
import { TwoFactorVerifyDto } from '../dtos/request/auth.2fa.verify.dto';
import {
    TwoFactorSetupResponseDto,
    TwoFactorVerifyResponseDto,
} from '../dtos/response/auth.2fa.response';

export interface IAuthService {
    login(data: UserLoginDto): Promise<AuthResponseDto>;
    signup(data: UserCreateDto): Promise<AuthResponseDto>;
    logout(): Promise<{ success: boolean; message: string }>;
    refreshTokens(payload: IAuthUser): Promise<AuthRefreshResponseDto>;
    setupTwoFactor(
        userId: string,
        data: TwoFactorSetupDto
    ): Promise<TwoFactorSetupResponseDto>;
    verifyTwoFactor(
        userId: string,
        data: TwoFactorVerifyDto
    ): Promise<TwoFactorVerifyResponseDto>;
    disableTwoFactor(
        userId: string,
        data: TwoFactorVerifyDto
    ): Promise<{ success: boolean; message: string }>;
}
