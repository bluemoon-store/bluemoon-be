import {
    HttpStatus,
    Injectable,
    HttpException,
    ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { SparkService } from 'src/modules/spark/services/spark.service';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';

import { ReferralCodeVerifyDto } from '../dtos/request/referral-code.verify.request';
import { UserUpdateDto } from '../dtos/request/user.update.request';
import {
    UserGetProfileResponseDto,
    UserUpdateProfileResponseDto,
} from '../dtos/response/user.response';
import { IUserService } from '../interfaces/user.service.interface';

@Injectable()
export class UserService implements IUserService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly sparkService: SparkService
    ) {}

    async updateUser(
        userId: string,
        data: UserUpdateDto
    ): Promise<UserUpdateProfileResponseDto> {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new HttpException(
                    'user.error.userNotFound',
                    HttpStatus.NOT_FOUND
                );
            }
            const updatedUser = await this.databaseService.user.update({
                where: { id: userId },
                data,
            });
            return updatedUser;
        } catch (error) {
            throw error;
        }
    }

    async deleteUser(
        userId: string,
        currentUserId: string,
        currentUserRole: Role
    ): Promise<ApiGenericResponseDto> {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new HttpException(
                    'user.error.userNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            if (currentUserRole !== Role.ADMIN && currentUserId !== userId) {
                throw new ForbiddenException(
                    'auth.error.insufficientPermissions'
                );
            }

            await this.databaseService.user.update({
                where: { id: userId },
                data: { deletedAt: new Date() },
            });

            return {
                success: true,
                message: 'user.success.userDeleted',
            };
        } catch (error) {
            if (
                error instanceof HttpException ||
                error instanceof ForbiddenException
            ) {
                throw error;
            }
            throw new HttpException(
                'user.error.failedToDeleteUser',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getProfile(id: string): Promise<UserGetProfileResponseDto> {
        const user = await this.databaseService.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new HttpException(
                'user.error.userNotFound',
                HttpStatus.NOT_FOUND
            );
        }
        return user;
    }

    async processReferral(
        newUserId: string,
        referralCode: string
    ): Promise<void> {
        try {
            // Find the referring user
            const referringUser = await this.databaseService.user.findUnique({
                where: { referralCode },
            });

            if (!referringUser) {
                throw new HttpException(
                    'user.error.invalidReferralCode',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Update the new user with referral info
            await this.databaseService.user.update({
                where: { id: newUserId },
                data: { referredBy: referringUser.id },
            });

            // Award sparks to the referring user
            await this.sparkService.earnSparks(
                referringUser.id,
                10,
                'Referral bonus for new user signup',
                newUserId
            );
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'user.error.failedToProcessReferral',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async awardDailySparks(userId: string): Promise<ApiGenericResponseDto> {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new HttpException(
                    'user.error.userNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Check if user already received daily sparks today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayTransaction =
                await this.databaseService.sparkTransaction.findFirst({
                    where: {
                        userId,
                        type: 'DAILY_RETURN',
                        createdAt: {
                            gte: today,
                        },
                    },
                });

            if (todayTransaction) {
                throw new HttpException(
                    'user.error.dailySparksAlreadyClaimed',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Award daily sparks
            await this.sparkService.earnSparks(userId, 1, 'Daily return bonus');

            return {
                success: true,
                message: 'user.success.dailySparksClaimed',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'user.error.failedToAwardDailySparks',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async verifyReferralCode(
        data: ReferralCodeVerifyDto
    ): Promise<ApiGenericResponseDto> {
        try {
            const { referralCode } = data;

            // Find the user with this referral code
            const user = await this.databaseService.user.findUnique({
                where: {
                    referralCode: referralCode.toUpperCase(),
                    deletedAt: null,
                },
            });

            if (!user) {
                return {
                    success: false,
                    message: 'user.error.invalidReferralCode',
                };
            }

            return {
                success: true,
                message: 'user.success.referralCodeVerified',
            };
        } catch (_error) {
            throw new HttpException(
                'user.error.failedToVerifyReferralCode',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
