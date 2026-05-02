import {
    HttpStatus,
    Injectable,
    HttpException,
    ForbiddenException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { isPrivilegedAdminRole } from 'src/common/request/constants/roles.constant';
import { HelperEncryptionService } from 'src/common/helper/services/helper.encryption.service';
import { HelperPaginationService } from 'src/common/helper/services/helper.pagination.service';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { UserUpdateDto } from '../dtos/request/user.update.request';
import { UserBanDto } from '../dtos/request/user.ban.request';
import { UserFlagDto } from '../dtos/request/user.flag.request';
import { UserListQueryDto } from '../dtos/request/user.list.query.request';
import {
    UserGetProfileResponseDto,
    UserUpdateProfileResponseDto,
} from '../dtos/response/user.response';
import {
    UserAdminListItemResponseDto,
    UserAdminStatsResponseDto,
} from '../dtos/response/user.admin.response';
import { PurchaseHistoryOrderDto } from '../dtos/response/user.purchase-history.response';
import { IUserService } from '../interfaces/user.service.interface';
import { ActivityLogEmitterService } from 'src/modules/activity-log/services/activity-log.emitter.service';

type UserWithWallet = Prisma.UserGetPayload<{ include: { wallet: true } }>;

@Injectable()
export class UserService implements IUserService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly helperEncryptionService: HelperEncryptionService,
        private readonly helperPaginationService: HelperPaginationService,
        private readonly activityLogEmitter: ActivityLogEmitterService
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
        currentUserRole: Role,
        password?: string
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

            if (
                !isPrivilegedAdminRole(currentUserRole) &&
                currentUserId !== userId
            ) {
                throw new ForbiddenException(
                    'auth.error.insufficientPermissions'
                );
            }

            const isAdminDeletingAnotherUser =
                isPrivilegedAdminRole(currentUserRole) &&
                currentUserId !== userId;

            if (!isAdminDeletingAnotherUser) {
                if (!password) {
                    throw new HttpException(
                        'auth.error.invalidPassword',
                        HttpStatus.BAD_REQUEST
                    );
                }

                const passwordMatched =
                    await this.helperEncryptionService.match(
                        user.password,
                        password
                    );

                if (!passwordMatched) {
                    throw new HttpException(
                        'auth.error.invalidPassword',
                        HttpStatus.BAD_REQUEST
                    );
                }
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

            this.activityLogEmitter.captureBefore({
                before: {
                    isBanned: user.isBanned,
                    bannedReason: user.bannedReason,
                },
            });

            await this.databaseService.user.update({
                where: { id: userId },
                data: {
                    isBanned: true,
                    bannedAt: new Date(),
                    bannedReason: data.reason || null,
                },
            });

            this.activityLogEmitter.captureAfter({
                after: {
                    isBanned: true,
                    bannedReason: data.reason || null,
                },
                resourceLabel: user.email,
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

            this.activityLogEmitter.captureBefore({
                before: {
                    isBanned: user.isBanned,
                    bannedReason: user.bannedReason,
                },
            });

            await this.databaseService.user.update({
                where: { id: userId },
                data: {
                    isBanned: false,
                    bannedAt: null,
                    bannedReason: null,
                },
            });

            this.activityLogEmitter.captureAfter({
                after: {
                    isBanned: false,
                    bannedReason: null,
                },
                resourceLabel: user.email,
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

    private mapUserToAdminListItem(
        user: UserWithWallet
    ): UserAdminListItemResponseDto {
        return {
            id: user.id,
            email: user.email,
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            role: user.role,
            isVerified: user.isVerified,
            isBanned: user.isBanned,
            bannedAt: user.bannedAt,
            bannedReason: user.bannedReason,
            isFlagged: user.isFlagged,
            flaggedAt: user.flaggedAt,
            flaggedReason: user.flaggedReason,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            deletedAt: user.deletedAt,
            walletBalance: user.wallet?.balance?.toString() ?? null,
        };
    }

    async listUsers(
        query: UserListQueryDto
    ): Promise<ApiPaginatedDataDto<UserAdminListItemResponseDto>> {
        try {
            const andFilters: Prisma.UserWhereInput[] = [];

            const searchFilter =
                this.helperPaginationService.buildSearchCondition(
                    query.search?.trim() ?? '',
                    ['email', 'firstName', 'lastName', 'userName']
                );
            if (searchFilter) {
                andFilters.push(searchFilter);
            }
            if (query.isBanned !== undefined) {
                andFilters.push({ isBanned: query.isBanned });
            }
            if (query.isVerified !== undefined) {
                andFilters.push({ isVerified: query.isVerified });
            }
            if (query.isFlagged !== undefined) {
                andFilters.push({ isFlagged: query.isFlagged });
            }

            const where: Prisma.UserWhereInput = {
                role: Role.USER,
                deletedAt: null,
                ...(andFilters.length > 0 ? { AND: andFilters } : {}),
            };

            const result =
                await this.helperPaginationService.paginate<UserWithWallet>(
                    this.databaseService.user,
                    {
                        page: query.page ?? 1,
                        limit: query.limit ?? 10,
                    },
                    {
                        where,
                        include: { wallet: true },
                        orderBy: { createdAt: 'desc' },
                    }
                );

            return {
                ...result,
                items: result.items.map(u => this.mapUserToAdminListItem(u)),
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'user.error.failedToListUsers',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getUserById(id: string): Promise<UserAdminListItemResponseDto> {
        const user = await this.databaseService.user.findFirst({
            where: { id, role: Role.USER, deletedAt: null },
            include: { wallet: true },
        });

        if (!user) {
            throw new HttpException(
                'user.error.userNotFound',
                HttpStatus.NOT_FOUND
            );
        }

        return this.mapUserToAdminListItem(user);
    }

    async getUserStats(): Promise<UserAdminStatsResponseDto> {
        const baseWhere: Prisma.UserWhereInput = {
            role: Role.USER,
            deletedAt: null,
        };

        try {
            const [total, guests, banned, flagged] = await Promise.all([
                this.databaseService.user.count({ where: baseWhere }),
                this.databaseService.user.count({
                    where: { ...baseWhere, isVerified: false },
                }),
                this.databaseService.user.count({
                    where: { ...baseWhere, isBanned: true },
                }),
                this.databaseService.user.count({
                    where: { ...baseWhere, isFlagged: true },
                }),
            ]);

            return { total, guests, banned, flagged };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'user.error.failedToGetUserStats',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async flagUser(
        userId: string,
        data: UserFlagDto
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

            if (user.isFlagged) {
                throw new HttpException(
                    'user.error.userAlreadyFlagged',
                    HttpStatus.BAD_REQUEST
                );
            }

            this.activityLogEmitter.captureBefore({
                before: {
                    isFlagged: user.isFlagged,
                    flaggedReason: user.flaggedReason,
                },
            });

            await this.databaseService.user.update({
                where: { id: userId },
                data: {
                    isFlagged: true,
                    flaggedAt: new Date(),
                    flaggedReason: data.reason ?? null,
                },
            });

            this.activityLogEmitter.captureAfter({
                after: {
                    isFlagged: true,
                    flaggedReason: data.reason ?? null,
                },
                resourceLabel: user.email,
            });

            return {
                success: true,
                message: 'user.success.userFlagged',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'user.error.failedToFlagUser',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async unflagUser(userId: string): Promise<ApiGenericResponseDto> {
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

            if (!user.isFlagged) {
                throw new HttpException(
                    'user.error.userNotFlagged',
                    HttpStatus.BAD_REQUEST
                );
            }

            this.activityLogEmitter.captureBefore({
                before: {
                    isFlagged: user.isFlagged,
                    flaggedReason: user.flaggedReason,
                },
            });

            await this.databaseService.user.update({
                where: { id: userId },
                data: {
                    isFlagged: false,
                    flaggedAt: null,
                    flaggedReason: null,
                },
            });

            this.activityLogEmitter.captureAfter({
                after: {
                    isFlagged: false,
                    flaggedReason: null,
                },
                resourceLabel: user.email,
            });

            return {
                success: true,
                message: 'user.success.userUnflagged',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'user.error.failedToUnflagUser',
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
