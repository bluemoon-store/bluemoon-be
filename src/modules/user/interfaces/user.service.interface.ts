import { Role } from '@prisma/client';

import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';

import { ReferralCodeVerifyDto } from '../dtos/request/referral-code.verify.request';
import { UserUpdateDto } from '../dtos/request/user.update.request';
import {
    UserGetProfileResponseDto,
    UserUpdateProfileResponseDto,
} from '../dtos/response/user.response';

export interface IUserService {
    updateUser(
        userId: string,
        data: UserUpdateDto
    ): Promise<UserUpdateProfileResponseDto>;
    deleteUser(
        userId: string,
        currentUserId: string,
        currentUserRole: Role
    ): Promise<ApiGenericResponseDto>;
    getProfile(userId: string): Promise<UserGetProfileResponseDto>;
    processReferral(newUserId: string, referralCode: string): Promise<void>;
    awardDailySparks(userId: string): Promise<ApiGenericResponseDto>;
    verifyReferralCode(
        data: ReferralCodeVerifyDto
    ): Promise<ApiGenericResponseDto>;
}
