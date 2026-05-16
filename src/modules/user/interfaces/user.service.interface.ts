import { Role } from '@prisma/client';

import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { UserUpdateDto } from '../dtos/request/user.update.request';
import {
    UserGetProfileResponseDto,
    UserUpdateProfileResponseDto,
} from '../dtos/response/user.response';
import { PurchaseHistoryOrderDto } from '../dtos/response/user.purchase-history.response';
import { UserListQueryDto } from '../dtos/request/user.list.query.request';
import { UserFlagDto } from '../dtos/request/user.flag.request';
import {
    UserAdminListItemResponseDto,
    UserAdminStatsResponseDto,
} from '../dtos/response/user.admin.response';

import { UserBanDto } from '../dtos/request/user.ban.request';
import { UserAdminCreateDto } from '../dtos/request/user.admin.create.request';
import { UserAdminCreateResponseDto } from '../dtos/response/user.admin.create.response';

export interface IUserService {
    updateUser(
        userId: string,
        data: UserUpdateDto
    ): Promise<UserUpdateProfileResponseDto>;
    updateAvatar(
        userId: string,
        avatar: string | null
    ): Promise<UserUpdateProfileResponseDto>;
    deleteUser(
        userId: string,
        currentUserId: string,
        currentUserRole: Role,
        password?: string
    ): Promise<ApiGenericResponseDto>;
    getProfile(userId: string): Promise<UserGetProfileResponseDto>;
    banUser(userId: string, data: UserBanDto): Promise<ApiGenericResponseDto>;
    unbanUser(userId: string): Promise<ApiGenericResponseDto>;
    getPurchaseHistory(userId: string): Promise<PurchaseHistoryOrderDto[]>;
    listUsers(
        query: UserListQueryDto
    ): Promise<ApiPaginatedDataDto<UserAdminListItemResponseDto>>;
    getUserById(id: string): Promise<UserAdminListItemResponseDto>;
    getUserStats(): Promise<UserAdminStatsResponseDto>;
    flagUser(userId: string, data: UserFlagDto): Promise<ApiGenericResponseDto>;
    unflagUser(userId: string): Promise<ApiGenericResponseDto>;
    createByAdmin(dto: UserAdminCreateDto): Promise<UserAdminCreateResponseDto>;
}
