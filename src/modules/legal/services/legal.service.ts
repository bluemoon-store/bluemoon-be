import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CmsContent, ContentType } from '@prisma/client';
import DOMPurify from 'isomorphic-dompurify';

import { DatabaseService } from 'src/common/database/services/database.service';

import { LegalUpdateRequestDto } from '../dtos/request/legal.update.request';
import { LegalResponseDto } from '../dtos/response/legal.response';

export type LegalType = 'TERMS' | 'PRIVACY' | 'REFUND' | 'COOKIE';

const LEGAL_CONFIG: Record<
    LegalType,
    { key: string; title: string; type: ContentType }
> = {
    TERMS: {
        key: 'legal:terms',
        title: 'Terms of Service',
        type: ContentType.TERMS,
    },
    PRIVACY: {
        key: 'legal:privacy',
        title: 'Privacy Policy',
        type: ContentType.PRIVACY,
    },
    REFUND: {
        key: 'legal:refund',
        title: 'Refund Policy',
        type: ContentType.REFUND,
    },
    COOKIE: {
        key: 'legal:cookie',
        title: 'Cookie Policy',
        type: ContentType.COOKIE,
    },
};

@Injectable()
export class LegalService {
    constructor(private readonly databaseService: DatabaseService) {}

    private resolveType(type: string): {
        key: string;
        title: string;
        type: ContentType;
    } {
        const upper = type?.toUpperCase() as LegalType;
        const entry = LEGAL_CONFIG[upper];
        if (!entry)
            throw new HttpException(
                'legal.error.invalidType',
                HttpStatus.BAD_REQUEST
            );
        return entry;
    }

    private mapRow(row: CmsContent): LegalResponseDto {
        return {
            id: row.id,
            key: row.key,
            type: row.type,
            title: row.title,
            content: row.content,
            updatedAt: row.updatedAt,
        };
    }

    async list(): Promise<LegalResponseDto[]> {
        const rows = await this.databaseService.cmsContent.findMany({
            where: {
                deletedAt: null,
                key: { in: Object.values(LEGAL_CONFIG).map(v => v.key) },
            },
            orderBy: { key: 'asc' },
        });
        return rows.map(row => this.mapRow(row));
    }

    async getOne(type: string): Promise<LegalResponseDto> {
        const config = this.resolveType(type);
        const row = await this.databaseService.cmsContent.findFirst({
            where: { key: config.key, deletedAt: null },
        });
        if (!row)
            throw new HttpException(
                'legal.error.notFound',
                HttpStatus.NOT_FOUND
            );
        return this.mapRow(row);
    }

    async update(
        type: string,
        payload: LegalUpdateRequestDto
    ): Promise<LegalResponseDto> {
        const config = this.resolveType(type);
        const row = await this.databaseService.cmsContent.upsert({
            where: { key: config.key },
            update: {
                type: config.type,
                title: payload.title?.trim() || config.title,
                content: DOMPurify.sanitize(payload.content),
                isPublished: true,
                deletedAt: null,
            },
            create: {
                key: config.key,
                type: config.type,
                title: payload.title?.trim() || config.title,
                content: DOMPurify.sanitize(payload.content),
                isPublished: true,
            },
        });
        return this.mapRow(row);
    }

    async listPublic(): Promise<LegalResponseDto[]> {
        const rows = await this.databaseService.cmsContent.findMany({
            where: {
                deletedAt: null,
                isPublished: true,
                key: { in: Object.values(LEGAL_CONFIG).map(v => v.key) },
            },
            orderBy: { key: 'asc' },
        });
        return rows.map(row => this.mapRow(row));
    }

    async getOnePublic(type: string): Promise<LegalResponseDto> {
        const config = this.resolveType(type);
        const row = await this.databaseService.cmsContent.findFirst({
            where: { key: config.key, isPublished: true, deletedAt: null },
        });
        if (!row)
            throw new HttpException(
                'legal.error.notFound',
                HttpStatus.NOT_FOUND
            );
        return this.mapRow(row);
    }
}
