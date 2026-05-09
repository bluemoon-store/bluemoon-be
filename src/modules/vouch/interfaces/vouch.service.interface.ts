import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { AdminVouchListQueryDto } from '../dtos/request/vouch.admin-list.request';
import { VouchCreateDto } from '../dtos/request/vouch.create.request';
import { VouchDropClaimCreateDto } from '../dtos/request/vouch.drop-claim.create.request';
import { VouchListQueryDto } from '../dtos/request/vouch.list.query';
import { VouchDropClaimResponseDto } from '../dtos/response/vouch.drop-claim.response';
import { VouchResponseDto } from '../dtos/response/vouch.response';

export interface IVouchService {
    create(
        userId: string,
        dto: VouchCreateDto,
        file: Express.Multer.File
    ): Promise<VouchResponseDto>;
    list(
        query: VouchListQueryDto
    ): Promise<ApiPaginatedDataDto<VouchResponseDto>>;
    listMine(
        userId: string,
        query: VouchListQueryDto
    ): Promise<ApiPaginatedDataDto<VouchResponseDto>>;
    listByProduct(
        productId: string,
        query: VouchListQueryDto
    ): Promise<ApiPaginatedDataDto<VouchResponseDto>>;
    deleteMine(userId: string, vouchId: string): Promise<void>;
    listAdmin(
        query: AdminVouchListQueryDto
    ): Promise<ApiPaginatedDataDto<VouchResponseDto>>;
    approveAdmin(
        vouchId: string,
        adminUserId: string
    ): Promise<VouchResponseDto>;
    deleteAdmin(vouchId: string): Promise<void>;
    createForDropClaim(
        userId: string,
        dto: VouchDropClaimCreateDto,
        file: Express.Multer.File
    ): Promise<VouchDropClaimResponseDto>;
    listByDropClaim(dropClaimId: string): Promise<VouchDropClaimResponseDto[]>;
    deleteMineDropClaim(userId: string, vouchId: string): Promise<void>;
}
