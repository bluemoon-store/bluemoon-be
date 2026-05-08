import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import DOMPurify from 'isomorphic-dompurify';

import { DatabaseService } from 'src/common/database/services/database.service';

import { FaqCreateCategoryRequestDto } from '../dtos/request/faq.create-category.request';
import { FaqCreateItemRequestDto } from '../dtos/request/faq.create-item.request';
import { FaqUpdateCategoryRequestDto } from '../dtos/request/faq.update-category.request';
import { FaqUpdateItemRequestDto } from '../dtos/request/faq.update-item.request';
import {
    FaqCategoryResponseDto,
    FaqItemResponseDto,
} from '../dtos/response/faq.response';

const PUBLIC_CACHE_KEY = 'faq:public';
const PUBLIC_CACHE_TTL_MS = 60_000;

@Injectable()
export class FaqService {
    constructor(
        private readonly databaseService: DatabaseService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
    ) {}

    private slugify(value: string): string {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    private async ensureUniqueSlug(
        base: string,
        excludeId?: string
    ): Promise<string> {
        const normalized = base || 'category';
        let slug = normalized;
        let i = 1;
        while (true) {
            const existing = await this.databaseService.faqCategory.findFirst({
                where: {
                    slug,
                    ...(excludeId ? { id: { not: excludeId } } : {}),
                },
                select: { id: true },
            });
            if (!existing) return slug;
            slug = `${normalized}-${i++}`;
        }
    }

    private mapItem(row: any): FaqItemResponseDto {
        return {
            id: row.id,
            categoryId: row.categoryId,
            question: row.question,
            answerHtml: row.answerHtml,
            position: row.position,
        };
    }

    private mapCategory(row: any): FaqCategoryResponseDto {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            position: row.position,
            items: (row.items ?? []).map((it: any) => this.mapItem(it)),
        };
    }

    private async invalidatePublicCache(): Promise<void> {
        await this.cacheManager.del(PUBLIC_CACHE_KEY);
    }

    async listCategories(): Promise<FaqCategoryResponseDto[]> {
        const rows = await this.databaseService.faqCategory.findMany({
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
            include: {
                items: {
                    where: { deletedAt: null },
                    orderBy: { position: 'asc' },
                },
            },
        });
        return rows.map(row => this.mapCategory(row));
    }

    async createCategory(
        payload: FaqCreateCategoryRequestDto
    ): Promise<FaqCategoryResponseDto> {
        const slug = await this.ensureUniqueSlug(this.slugify(payload.name));
        const maxPosition = await this.databaseService.faqCategory.aggregate({
            where: { deletedAt: null },
            _max: { position: true },
        });
        const row = await this.databaseService.faqCategory.create({
            data: {
                name: payload.name.trim(),
                slug,
                position: (maxPosition._max.position ?? -1) + 1,
            },
            include: {
                items: {
                    where: { deletedAt: null },
                    orderBy: { position: 'asc' },
                },
            },
        });
        await this.invalidatePublicCache();
        return this.mapCategory(row);
    }

    async updateCategory(
        id: string,
        payload: FaqUpdateCategoryRequestDto
    ): Promise<FaqCategoryResponseDto> {
        const existing = await this.databaseService.faqCategory.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new HttpException(
                'faq.error.categoryNotFound',
                HttpStatus.NOT_FOUND
            );

        const slug =
            payload.name !== undefined
                ? await this.ensureUniqueSlug(this.slugify(payload.name), id)
                : existing.slug;
        await this.databaseService.faqCategory.update({
            where: { id },
            data: {
                ...(payload.name !== undefined
                    ? { name: payload.name.trim(), slug }
                    : {}),
                ...(payload.position !== undefined
                    ? { position: payload.position }
                    : {}),
            },
        });

        await this.invalidatePublicCache();
        const row = await this.databaseService.faqCategory.findFirst({
            where: { id, deletedAt: null },
            include: {
                items: {
                    where: { deletedAt: null },
                    orderBy: { position: 'asc' },
                },
            },
        });
        if (!row)
            throw new HttpException(
                'faq.error.categoryNotFound',
                HttpStatus.NOT_FOUND
            );
        return this.mapCategory(row);
    }

    async deleteCategory(id: string): Promise<{ success: boolean }> {
        const existing = await this.databaseService.faqCategory.findFirst({
            where: { id, deletedAt: null },
            select: { id: true },
        });
        if (!existing)
            throw new HttpException(
                'faq.error.categoryNotFound',
                HttpStatus.NOT_FOUND
            );

        await this.databaseService.$transaction(async tx => {
            await tx.faqItem.updateMany({
                where: { categoryId: id, deletedAt: null },
                data: { deletedAt: new Date() },
            });
            await tx.faqCategory.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
        });

        await this.invalidatePublicCache();
        return { success: true };
    }

    async reorderCategories(
        orderedIds: string[]
    ): Promise<{ success: boolean }> {
        await this.databaseService.$transaction(async tx => {
            const rows = await tx.faqCategory.findMany({
                where: { id: { in: orderedIds }, deletedAt: null },
                select: { id: true },
            });
            if (rows.length !== orderedIds.length)
                throw new HttpException(
                    'faq.error.categoryNotFound',
                    HttpStatus.NOT_FOUND
                );
            await Promise.all(
                orderedIds.map((id, index) =>
                    tx.faqCategory.update({
                        where: { id },
                        data: { position: index },
                    })
                )
            );
        });
        await this.invalidatePublicCache();
        return { success: true };
    }

    async createItem(
        categoryId: string,
        payload: FaqCreateItemRequestDto
    ): Promise<FaqItemResponseDto> {
        const category = await this.databaseService.faqCategory.findFirst({
            where: { id: categoryId, deletedAt: null },
            select: { id: true },
        });
        if (!category)
            throw new HttpException(
                'faq.error.categoryNotFound',
                HttpStatus.NOT_FOUND
            );

        const maxPosition = await this.databaseService.faqItem.aggregate({
            where: { categoryId, deletedAt: null },
            _max: { position: true },
        });
        const row = await this.databaseService.faqItem.create({
            data: {
                categoryId,
                question: payload.question.trim(),
                answerHtml: DOMPurify.sanitize(payload.answerHtml),
                position: (maxPosition._max.position ?? -1) + 1,
            },
        });
        await this.invalidatePublicCache();
        return this.mapItem(row);
    }

    async updateItem(
        id: string,
        payload: FaqUpdateItemRequestDto
    ): Promise<FaqItemResponseDto> {
        const existing = await this.databaseService.faqItem.findFirst({
            where: { id, deletedAt: null },
        });
        if (!existing)
            throw new HttpException(
                'faq.error.itemNotFound',
                HttpStatus.NOT_FOUND
            );

        const row = await this.databaseService.faqItem.update({
            where: { id },
            data: {
                ...(payload.question !== undefined
                    ? { question: payload.question.trim() }
                    : {}),
                ...(payload.answerHtml !== undefined
                    ? { answerHtml: DOMPurify.sanitize(payload.answerHtml) }
                    : {}),
            },
        });

        await this.invalidatePublicCache();
        return this.mapItem(row);
    }

    async deleteItem(id: string): Promise<{ success: boolean }> {
        const existing = await this.databaseService.faqItem.findFirst({
            where: { id, deletedAt: null },
            select: { id: true },
        });
        if (!existing)
            throw new HttpException(
                'faq.error.itemNotFound',
                HttpStatus.NOT_FOUND
            );

        await this.databaseService.faqItem.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        await this.invalidatePublicCache();
        return { success: true };
    }

    async reorderItems(
        categoryId: string,
        orderedIds: string[]
    ): Promise<{ success: boolean }> {
        await this.databaseService.$transaction(async tx => {
            const rows = await tx.faqItem.findMany({
                where: { categoryId, id: { in: orderedIds }, deletedAt: null },
                select: { id: true },
            });
            if (rows.length !== orderedIds.length)
                throw new HttpException(
                    'faq.error.itemNotFound',
                    HttpStatus.NOT_FOUND
                );
            await Promise.all(
                orderedIds.map((id, index) =>
                    tx.faqItem.update({
                        where: { id },
                        data: { position: index },
                    })
                )
            );
        });
        await this.invalidatePublicCache();
        return { success: true };
    }

    async listPublic(): Promise<FaqCategoryResponseDto[]> {
        const cached =
            await this.cacheManager.get<FaqCategoryResponseDto[]>(
                PUBLIC_CACHE_KEY
            );
        if (cached) return cached;

        const rows = await this.databaseService.faqCategory.findMany({
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
            include: {
                items: {
                    where: { deletedAt: null },
                    orderBy: { position: 'asc' },
                },
            },
        });
        const out = rows.map(row => this.mapCategory(row));
        await this.cacheManager.set(PUBLIC_CACHE_KEY, out, PUBLIC_CACHE_TTL_MS);
        return out;
    }
}
