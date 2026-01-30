import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';

import { ProductCreateDto } from '../dtos/request/product.create.request';
import { ProductUpdateDto } from '../dtos/request/product.update.request';
import { ProductSearchDto } from '../dtos/request/product.search.request';
import {
    ProductResponseDto,
    ProductListResponseDto,
} from '../dtos/response/product.response';

export interface IProductService {
    create(data: ProductCreateDto): Promise<ProductResponseDto>;
    findAll(options?: {
        page?: number;
        limit?: number;
        categoryId?: string;
        isActive?: boolean;
        isFeatured?: boolean;
    }): Promise<ApiPaginatedDataDto<ProductListResponseDto>>;
    search(
        query: ProductSearchDto
    ): Promise<ApiPaginatedDataDto<ProductListResponseDto>>;
    findOne(id: string): Promise<ProductResponseDto>;
    findBySlug(slug: string): Promise<ProductResponseDto>;
    update(id: string, data: ProductUpdateDto): Promise<ProductResponseDto>;
    delete(id: string): Promise<ApiGenericResponseDto>;
    updateStock(id: string, stockQuantity: number): Promise<ProductResponseDto>;
    toggleActive(id: string): Promise<ProductResponseDto>;
    toggleFeatured(id: string): Promise<ProductResponseDto>;
    addImage(
        productId: string,
        imageKey: string,
        isPrimary?: boolean
    ): Promise<ProductResponseDto>;
    removeImage(
        productId: string,
        imageId: string
    ): Promise<ProductResponseDto>;
    setPrimaryImage(
        productId: string,
        imageId: string
    ): Promise<ProductResponseDto>;
}
