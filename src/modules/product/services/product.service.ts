import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Prisma } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { HelperPaginationService } from 'src/common/helper/services/helper.pagination.service';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';

import { ProductCreateDto } from '../dtos/request/product.create.request';
import { ProductUpdateDto } from '../dtos/request/product.update.request';
import { ProductSearchDto } from '../dtos/request/product.search.request';
import {
    ProductResponseDto,
    ProductListResponseDto,
} from '../dtos/response/product.response';
import { IProductService } from '../interfaces/product.service.interface';

@Injectable()
export class ProductService implements IProductService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly paginationService: HelperPaginationService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(ProductService.name);
    }

    /**
     * Generate a URL-friendly slug from a string
     */
    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }

    /**
     * Ensure slug is unique by appending a number if needed
     */
    private async ensureUniqueSlug(
        baseSlug: string,
        excludeId?: string
    ): Promise<string> {
        let slug = baseSlug;
        let counter = 1;

        while (true) {
            const existing = await this.databaseService.product.findFirst({
                where: {
                    slug,
                    ...(excludeId && { id: { not: excludeId } }),
                    deletedAt: null,
                },
            });

            if (!existing) {
                return slug;
            }

            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }

    async create(data: ProductCreateDto): Promise<ProductResponseDto> {
        try {
            // Verify category exists
            const category =
                await this.databaseService.productCategory.findFirst({
                    where: {
                        id: data.categoryId,
                        deletedAt: null,
                    },
                });

            if (!category) {
                throw new HttpException(
                    'product.error.categoryNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Generate slug if not provided
            const slug = data.slug
                ? await this.ensureUniqueSlug(this.generateSlug(data.slug))
                : await this.ensureUniqueSlug(this.generateSlug(data.name));

            // Create product
            const product = await this.databaseService.product.create({
                data: {
                    name: data.name,
                    slug,
                    description: data.description,
                    price: data.price,
                    currency: data.currency ?? 'USD',
                    stockQuantity: data.stockQuantity ?? 0,
                    isActive: data.isActive ?? true,
                    isFeatured: data.isFeatured ?? false,
                    categoryId: data.categoryId,
                    deliveryType: data.deliveryType ?? 'INSTANT',
                    deliveryContent: data.deliveryContent,
                },
                include: {
                    category: true,
                    images: {
                        where: { deletedAt: null },
                        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                    },
                },
            });

            // Create images if provided
            if (data.images && data.images.length > 0) {
                const imageData = data.images.map((img, index) => ({
                    productId: product.id,
                    key: img.key,
                    isPrimary: img.isPrimary ?? index === 0,
                    sortOrder: img.sortOrder ?? index,
                }));

                // Ensure only one primary image
                if (imageData.some(img => img.isPrimary)) {
                    await this.databaseService.productImage.createMany({
                        data: imageData,
                    });
                } else {
                    // Set first image as primary if none specified
                    imageData[0].isPrimary = true;
                    await this.databaseService.productImage.createMany({
                        data: imageData,
                    });
                }
            }

            // Fetch product with images
            const productWithImages =
                await this.databaseService.product.findUnique({
                    where: { id: product.id },
                    include: {
                        category: true,
                        images: {
                            where: { deletedAt: null },
                            orderBy: [
                                { isPrimary: 'desc' },
                                { sortOrder: 'asc' },
                            ],
                        },
                    },
                });

            this.logger.info({ productId: product.id }, 'Product created');
            return productWithImages as ProductResponseDto;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to create product: ${error.message}`);
            throw new HttpException(
                'product.error.createProductFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async findAll(options?: {
        page?: number;
        limit?: number;
        categoryId?: string;
        isActive?: boolean;
        isFeatured?: boolean;
    }): Promise<any> {
        try {
            const where: Prisma.ProductWhereInput = {
                deletedAt: null,
            };

            if (options?.categoryId) {
                where.categoryId = options.categoryId;
            }

            if (options?.isActive !== undefined) {
                where.isActive = options.isActive;
            }

            if (options?.isFeatured !== undefined) {
                where.isFeatured = options.isFeatured;
            }

            const result = await this.paginationService.paginate(
                this.databaseService.product,
                {
                    page: options?.page ?? 1,
                    limit: options?.limit ?? 10,
                },
                {
                    where,
                    include: {
                        category: true,
                        images: {
                            where: { deletedAt: null },
                            orderBy: [
                                { isPrimary: 'desc' },
                                { sortOrder: 'asc' },
                            ],
                        },
                    },
                    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
                }
            );

            return result;
        } catch (error) {
            this.logger.error(`Failed to list products: ${error.message}`);
            throw new HttpException(
                'product.error.listProductsFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async search(query: ProductSearchDto): Promise<any> {
        try {
            const where: Prisma.ProductWhereInput = {
                deletedAt: null,
            };

            // Category filter
            if (query.categoryId) {
                where.categoryId = query.categoryId;
            }

            // Active status filter
            if (query.isActive !== undefined) {
                where.isActive = query.isActive;
            }

            // Featured filter
            if (query.isFeatured !== undefined) {
                where.isFeatured = query.isFeatured;
            }

            // Price range filter
            if (query.minPrice !== undefined || query.maxPrice !== undefined) {
                where.price = {};
                if (query.minPrice !== undefined) {
                    where.price.gte = query.minPrice.toString();
                }
                if (query.maxPrice !== undefined) {
                    where.price.lte = query.maxPrice.toString();
                }
            }

            // Search query
            if (query.searchQuery) {
                where.OR = [
                    {
                        name: {
                            contains: query.searchQuery,
                            mode: 'insensitive',
                        },
                    },
                    {
                        description: {
                            contains: query.searchQuery,
                            mode: 'insensitive',
                        },
                    },
                    {
                        slug: {
                            contains: query.searchQuery,
                            mode: 'insensitive',
                        },
                    },
                ];
            }

            // Build order by
            let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
            if (query.sortBy) {
                const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
                orderBy.push({
                    [query.sortBy]: sortOrder,
                } as Prisma.ProductOrderByWithRelationInput);
            } else {
                orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
            }

            const result = await this.paginationService.paginate(
                this.databaseService.product,
                {
                    page: query.page ?? 1,
                    limit: query.limit ?? 10,
                },
                {
                    where,
                    include: {
                        category: true,
                        images: {
                            where: { deletedAt: null },
                            orderBy: [
                                { isPrimary: 'desc' },
                                { sortOrder: 'asc' },
                            ],
                        },
                    },
                    orderBy,
                }
            );

            return result;
        } catch (error) {
            this.logger.error(`Failed to search products: ${error.message}`);
            throw new HttpException(
                'product.error.searchProductsFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async findOne(id: string): Promise<ProductResponseDto> {
        try {
            const product = await this.databaseService.product.findFirst({
                where: {
                    id,
                    deletedAt: null,
                },
                include: {
                    category: true,
                    images: {
                        where: { deletedAt: null },
                        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                    },
                },
            });

            if (!product) {
                throw new HttpException(
                    'product.error.productNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            return product as ProductResponseDto;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to find product: ${error.message}`);
            throw new HttpException(
                'product.error.findProductFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async findBySlug(slug: string): Promise<ProductResponseDto> {
        try {
            const product = await this.databaseService.product.findFirst({
                where: {
                    slug,
                    deletedAt: null,
                },
                include: {
                    category: true,
                    images: {
                        where: { deletedAt: null },
                        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                    },
                },
            });

            if (!product) {
                throw new HttpException(
                    'product.error.productNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            return product as ProductResponseDto;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(
                `Failed to find product by slug: ${error.message}`
            );
            throw new HttpException(
                'product.error.findProductFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async update(
        id: string,
        data: ProductUpdateDto
    ): Promise<ProductResponseDto> {
        try {
            // Check if product exists
            await this.findOne(id);

            // Verify category exists if being updated
            if (data.categoryId) {
                const category =
                    await this.databaseService.productCategory.findFirst({
                        where: {
                            id: data.categoryId,
                            deletedAt: null,
                        },
                    });

                if (!category) {
                    throw new HttpException(
                        'product.error.categoryNotFound',
                        HttpStatus.NOT_FOUND
                    );
                }
            }

            // Generate slug if name is being updated
            let slug = data.slug;
            if (data.name && !data.slug) {
                slug = await this.ensureUniqueSlug(
                    this.generateSlug(data.name),
                    id
                );
            } else if (data.slug) {
                slug = await this.ensureUniqueSlug(
                    this.generateSlug(data.slug),
                    id
                );
            }

            const updateData: any = { ...data };
            if (slug) {
                updateData.slug = slug;
            }

            const product = await this.databaseService.product.update({
                where: { id },
                data: updateData,
                include: {
                    category: true,
                    images: {
                        where: { deletedAt: null },
                        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                    },
                },
            });

            this.logger.info({ productId: id }, 'Product updated');
            return product as ProductResponseDto;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to update product: ${error.message}`);
            throw new HttpException(
                'product.error.updateProductFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async delete(id: string): Promise<ApiGenericResponseDto> {
        try {
            // Check if product exists
            await this.findOne(id);

            // Check if product has orders
            const orderItemCount = await this.databaseService.orderItem.count({
                where: {
                    productId: id,
                },
            });

            if (orderItemCount > 0) {
                throw new HttpException(
                    'product.error.productHasOrders',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Soft delete product and images
            await this.databaseService.$transaction([
                this.databaseService.product.update({
                    where: { id },
                    data: { deletedAt: new Date() },
                }),
                this.databaseService.productImage.updateMany({
                    where: { productId: id },
                    data: { deletedAt: new Date() },
                }),
            ]);

            this.logger.info({ productId: id }, 'Product deleted');
            return {
                statusCode: HttpStatus.OK,
                message: 'product.success.productDeleted',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to delete product: ${error.message}`);
            throw new HttpException(
                'product.error.deleteProductFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async updateStock(
        id: string,
        stockQuantity: number
    ): Promise<ProductResponseDto> {
        try {
            if (stockQuantity < 0) {
                throw new HttpException(
                    'product.error.invalidStockQuantity',
                    HttpStatus.BAD_REQUEST
                );
            }

            const product = await this.databaseService.product.update({
                where: { id },
                data: { stockQuantity },
                include: {
                    category: true,
                    images: {
                        where: { deletedAt: null },
                        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                    },
                },
            });

            this.logger.info(
                { productId: id, stockQuantity },
                'Product stock updated'
            );
            return product as ProductResponseDto;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to update stock: ${error.message}`);
            throw new HttpException(
                'product.error.updateStockFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async toggleActive(id: string): Promise<ProductResponseDto> {
        try {
            const product = await this.findOne(id);

            const updated = await this.databaseService.product.update({
                where: { id },
                data: {
                    isActive: !product.isActive,
                },
                include: {
                    category: true,
                    images: {
                        where: { deletedAt: null },
                        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                    },
                },
            });

            this.logger.info(
                { productId: id, isActive: updated.isActive },
                'Product active status toggled'
            );
            return updated as ProductResponseDto;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(
                `Failed to toggle product active status: ${error.message}`
            );
            throw new HttpException(
                'product.error.toggleProductActiveFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async toggleFeatured(id: string): Promise<ProductResponseDto> {
        try {
            const product = await this.findOne(id);

            const updated = await this.databaseService.product.update({
                where: { id },
                data: {
                    isFeatured: !product.isFeatured,
                },
                include: {
                    category: true,
                    images: {
                        where: { deletedAt: null },
                        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                    },
                },
            });

            this.logger.info(
                { productId: id, isFeatured: updated.isFeatured },
                'Product featured status toggled'
            );
            return updated as ProductResponseDto;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(
                `Failed to toggle product featured status: ${error.message}`
            );
            throw new HttpException(
                'product.error.toggleProductFeaturedFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async addImage(
        productId: string,
        imageKey: string,
        isPrimary: boolean = false
    ): Promise<ProductResponseDto> {
        try {
            // Verify product exists
            await this.findOne(productId);

            // If setting as primary, unset other primary images
            if (isPrimary) {
                await this.databaseService.productImage.updateMany({
                    where: {
                        productId,
                        isPrimary: true,
                        deletedAt: null,
                    },
                    data: { isPrimary: false },
                });
            }

            // Get max sort order
            const maxSortOrder =
                await this.databaseService.productImage.findFirst({
                    where: {
                        productId,
                        deletedAt: null,
                    },
                    orderBy: { sortOrder: 'desc' },
                    select: { sortOrder: true },
                });

            const sortOrder = maxSortOrder ? maxSortOrder.sortOrder + 1 : 0;

            // Create image
            await this.databaseService.productImage.create({
                data: {
                    productId,
                    key: imageKey,
                    isPrimary,
                    sortOrder,
                },
            });

            // Return updated product
            return this.findOne(productId);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to add image: ${error.message}`);
            throw new HttpException(
                'product.error.addImageFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async removeImage(
        productId: string,
        imageId: string
    ): Promise<ProductResponseDto> {
        try {
            // Verify product exists
            await this.findOne(productId);

            // Verify image exists and belongs to product
            const image = await this.databaseService.productImage.findFirst({
                where: {
                    id: imageId,
                    productId,
                    deletedAt: null,
                },
            });

            if (!image) {
                throw new HttpException(
                    'product.error.imageNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Soft delete image
            await this.databaseService.productImage.update({
                where: { id: imageId },
                data: { deletedAt: new Date() },
            });

            // If it was primary, set first remaining image as primary
            if (image.isPrimary) {
                const nextImage =
                    await this.databaseService.productImage.findFirst({
                        where: {
                            productId,
                            deletedAt: null,
                        },
                        orderBy: { sortOrder: 'asc' },
                    });

                if (nextImage) {
                    await this.databaseService.productImage.update({
                        where: { id: nextImage.id },
                        data: { isPrimary: true },
                    });
                }
            }

            // Return updated product
            return this.findOne(productId);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to remove image: ${error.message}`);
            throw new HttpException(
                'product.error.removeImageFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async setPrimaryImage(
        productId: string,
        imageId: string
    ): Promise<ProductResponseDto> {
        try {
            // Verify product exists
            await this.findOne(productId);

            // Verify image exists and belongs to product
            const image = await this.databaseService.productImage.findFirst({
                where: {
                    id: imageId,
                    productId,
                    deletedAt: null,
                },
            });

            if (!image) {
                throw new HttpException(
                    'product.error.imageNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Unset all primary images
            await this.databaseService.productImage.updateMany({
                where: {
                    productId,
                    isPrimary: true,
                    deletedAt: null,
                },
                data: { isPrimary: false },
            });

            // Set this image as primary
            await this.databaseService.productImage.update({
                where: { id: imageId },
                data: { isPrimary: true },
            });

            // Return updated product
            return this.findOne(productId);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            this.logger.error(`Failed to set primary image: ${error.message}`);
            throw new HttpException(
                'product.error.setPrimaryImageFailed',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
