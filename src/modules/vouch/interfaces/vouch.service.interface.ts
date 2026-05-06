import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { VouchCreateDto } from '../dtos/request/vouch.create.request';
import { VouchListQueryDto } from '../dtos/request/vouch.list.query';
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
}
