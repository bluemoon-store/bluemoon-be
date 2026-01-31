import {
    HttpStatus,
    Injectable,
    HttpException,
    ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';

import { UserUpdateDto } from '../dtos/request/user.update.request';
import { UserBanDto } from '../dtos/request/user.ban.request';
import {
    UserGetProfileResponseDto,
    UserUpdateProfileResponseDto,
} from '../dtos/response/user.response';
import { PurchaseHistoryOrderDto } from '../dtos/response/user.purchase-history.response';
import { IUserService } from '../interfaces/user.service.interface';

@Injectable()
export class UserService implements IUserService {
    constructor(private readonly databaseService: DatabaseService) {}

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

    async banUser(
        userId: string,
        data: UserBanDto
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

            if (user.isBanned) {
                throw new HttpException(
                    'user.error.userAlreadyBanned',
                    HttpStatus.BAD_REQUEST
                );
            }

            await this.databaseService.user.update({
                where: { id: userId },
                data: {
                    isBanned: true,
                    bannedAt: new Date(),
                    bannedReason: data.reason || null,
                },
            });

            return {
                success: true,
                message: 'user.success.userBanned',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'user.error.failedToBanUser',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async unbanUser(userId: string): Promise<ApiGenericResponseDto> {
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

            if (!user.isBanned) {
                throw new HttpException(
                    'user.error.userNotBanned',
                    HttpStatus.BAD_REQUEST
                );
            }

            await this.databaseService.user.update({
                where: { id: userId },
                data: {
                    isBanned: false,
                    bannedAt: null,
                    bannedReason: null,
                },
            });

            return {
                success: true,
                message: 'user.success.userUnbanned',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'user.error.failedToUnbanUser',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getPurchaseHistory(
        userId: string
    ): Promise<PurchaseHistoryOrderDto[]> {
        try {
            const orders = await this.databaseService.order.findMany({
                where: {
                    userId,
                    deletedAt: null,
                },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    category: true,
                                    images: {
                                        where: { isPrimary: true },
                                        take: 1,
                                    },
                                },
                            },
                        },
                    },
                    cryptoPayment: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            return orders as unknown as PurchaseHistoryOrderDto[];
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'user.error.failedToGetPurchaseHistory',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
