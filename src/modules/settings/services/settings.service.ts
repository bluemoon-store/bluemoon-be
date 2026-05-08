import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { Cache } from 'cache-manager';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import { DatabaseService } from 'src/common/database/services/database.service';

import { SettingsUpdateGeneralRequestDto } from '../dtos/request/settings.update-general.request';
import { SettingsUpdateSocialRequestDto } from '../dtos/request/settings.update-social.request';
import { SettingsEmailValidityTestResponseDto } from '../dtos/response/settings.email-validity-test.response';
import { SettingsGeneralResponseDto } from '../dtos/response/settings.general.response';
import { SettingsPublicResponseDto } from '../dtos/response/settings.public.response';
import { SettingsSocialResponseDto } from '../dtos/response/settings.social.response';

const CACHE_KEY = 'settings:public';
const CACHE_TTL_MS = 60_000;

const KEYS = {
    supportLink: 'support_link',
    telegramLink: 'telegram_link',
    discordLink: 'discord_link',
} as const;

@Injectable()
export class SettingsService {
    constructor(
        private readonly databaseService: DatabaseService,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
    ) {}

    private normalizeNullable(value?: string | null): string | null {
        if (value == null) return null;
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    }

    private toPublicNullable(value: string | null): string | null {
        if (value == null) return null;
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    }

    private async upsertSetting(
        key: string,
        category: string,
        value: string | null
    ): Promise<void> {
        await this.databaseService.systemSettings.upsert({
            where: { key },
            update: { value: value ?? '', category, isPublic: true },
            create: { key, value: value ?? '', category, isPublic: true },
        });
    }

    async getGeneral(): Promise<SettingsGeneralResponseDto> {
        const row = await this.databaseService.systemSettings.findUnique({
            where: { key: KEYS.supportLink },
        });
        return { supportLink: this.toPublicNullable(row?.value ?? null) };
    }

    async updateGeneral(
        payload: SettingsUpdateGeneralRequestDto
    ): Promise<SettingsGeneralResponseDto> {
        if (payload.supportLink !== undefined) {
            await this.upsertSetting(
                KEYS.supportLink,
                'general',
                this.normalizeNullable(payload.supportLink)
            );
            await this.cacheManager.del(CACHE_KEY);
        }
        return this.getGeneral();
    }

    async getSocial(): Promise<SettingsSocialResponseDto> {
        const rows = await this.databaseService.systemSettings.findMany({
            where: { key: { in: [KEYS.telegramLink, KEYS.discordLink] } },
            select: { key: true, value: true },
        });
        const byKey = new Map(rows.map(row => [row.key, row.value]));
        return {
            telegramLink: this.toPublicNullable(
                byKey.get(KEYS.telegramLink) ?? null
            ),
            discordLink: this.toPublicNullable(
                byKey.get(KEYS.discordLink) ?? null
            ),
        };
    }

    async updateSocial(
        payload: SettingsUpdateSocialRequestDto
    ): Promise<SettingsSocialResponseDto> {
        let didUpdate = false;
        if (payload.telegramLink !== undefined) {
            await this.upsertSetting(
                KEYS.telegramLink,
                'social',
                this.normalizeNullable(payload.telegramLink)
            );
            didUpdate = true;
        }
        if (payload.discordLink !== undefined) {
            await this.upsertSetting(
                KEYS.discordLink,
                'social',
                this.normalizeNullable(payload.discordLink)
            );
            didUpdate = true;
        }
        if (didUpdate) {
            await this.cacheManager.del(CACHE_KEY);
        }
        return this.getSocial();
    }

    async getPublic(): Promise<SettingsPublicResponseDto> {
        const cached =
            await this.cacheManager.get<SettingsPublicResponseDto>(CACHE_KEY);
        if (cached) return cached;

        const rows = await this.databaseService.systemSettings.findMany({
            where: {
                isPublic: true,
                key: {
                    in: [KEYS.supportLink, KEYS.telegramLink, KEYS.discordLink],
                },
            },
            select: { key: true, value: true },
        });
        const byKey = new Map(rows.map(row => [row.key, row.value]));
        const out = {
            supportLink: this.toPublicNullable(
                byKey.get(KEYS.supportLink) ?? null
            ),
            telegramLink: this.toPublicNullable(
                byKey.get(KEYS.telegramLink) ?? null
            ),
            discordLink: this.toPublicNullable(
                byKey.get(KEYS.discordLink) ?? null
            ),
        };

        await this.cacheManager.set(CACHE_KEY, out, CACHE_TTL_MS);
        return out;
    }

    private isBlockedIp(host: string): boolean {
        const version = isIP(host);
        if (!version) return false;
        if (version === 4) {
            const [a, b] = host.split('.').map(Number);
            if (a === 127 || a === 10 || a === 0) return true;
            if (a === 169 && b === 254) return true;
            if (a === 192 && b === 168) return true;
            if (a === 172 && b >= 16 && b <= 31) return true;
            return false;
        }
        const normalized = host.toLowerCase();
        return (
            normalized === '::1' ||
            normalized.startsWith('fe80:') ||
            normalized.startsWith('fc') ||
            normalized.startsWith('fd')
        );
    }

    private async assertPublicHost(hostname: string): Promise<void> {
        if (hostname.toLowerCase() === 'localhost') {
            throw new HttpException(
                'settings.error.privateHostBlocked',
                HttpStatus.BAD_REQUEST
            );
        }
        const resolved = await lookup(hostname, { all: true });
        if (!resolved.length) {
            throw new HttpException(
                'settings.error.dnsResolutionFailed',
                HttpStatus.BAD_REQUEST
            );
        }
        for (const item of resolved) {
            if (this.isBlockedIp(item.address)) {
                throw new HttpException(
                    'settings.error.privateHostBlocked',
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    private assertRedirectHost(hostname?: string): void {
        if (!hostname) return;
        const lowered = hostname.toLowerCase();
        if (lowered === 'localhost' || this.isBlockedIp(lowered)) {
            throw new HttpException(
                'settings.error.privateHostBlocked',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    async testEmailValidityUrl(
        url: string
    ): Promise<SettingsEmailValidityTestResponseDto> {
        const parsed = new URL(url);
        await this.assertPublicHost(parsed.hostname);

        const started = Date.now();
        try {
            const response = await axios.get(url, {
                timeout: 5000,
                maxRedirects: 3,
                validateStatus: () => true,
                responseType: 'text',
                beforeRedirect: options => {
                    this.assertRedirectHost(options.hostname);
                },
            });
            return {
                ok: response.status >= 200 && response.status < 400,
                status: response.status,
                latencyMs: Date.now() - started,
            };
        } catch (error) {
            return {
                ok: false,
                status: null,
                latencyMs: Date.now() - started,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
