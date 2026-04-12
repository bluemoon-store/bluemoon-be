import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PinoLogger } from 'nestjs-pino';

import { IStorageService } from '../interfaces/storage.service.interface';

/** Supabase signed upload URLs are valid for at most two hours. */
const MAX_SIGNED_UPLOAD_EXPIRES_SEC = 7200;

@Injectable()
export class SupabaseStorageService implements IStorageService {
    private readonly client: SupabaseClient;
    private readonly bucket: string;
    private readonly linkExpire: number;

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(SupabaseStorageService.name);

        const url = this.configService.get<string>('supabase.url');
        const serviceRoleKey = this.configService.get<string>(
            'supabase.serviceRoleKey'
        );

        this.client = createClient(url, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });

        this.bucket = this.configService.get<string>('supabase.storage.bucket');
        this.linkExpire = this.configService.get<number>(
            'supabase.storage.presignExpires',
            3600
        );

        this.logger.info(
            { bucket: this.bucket },
            'Supabase storage service initialized'
        );
    }

    async getPresignedUploadUrl(
        key: string,
        contentType: string,
        expiresIn?: number
    ): Promise<{ url: string; expiresIn: number }> {
        try {
            const requested = expiresIn ?? this.linkExpire;
            const effectiveExpires = Math.min(
                requested,
                MAX_SIGNED_UPLOAD_EXPIRES_SEC
            );

            const { data, error } = await this.client.storage
                .from(this.bucket)
                .createSignedUploadUrl(key);

            if (error) {
                throw error;
            }

            this.logger.debug(
                { key, contentType, expiresIn: effectiveExpires },
                'Generated presigned upload URL'
            );

            return { url: data.signedUrl, expiresIn: effectiveExpires };
        } catch (error) {
            this.logger.error(
                `Failed to generate presigned URL: ${error.message}`
            );
            throw error;
        }
    }

    async uploadObject(
        key: string,
        body: Buffer | string,
        contentType: string
    ): Promise<void> {
        try {
            const { error } = await this.client.storage
                .from(this.bucket)
                .upload(key, body, {
                    contentType,
                    upsert: true,
                });

            if (error) {
                throw error;
            }

            this.logger.info(
                { key, contentType },
                'Object uploaded to storage'
            );
        } catch (error) {
            this.logger.error(
                `Failed to upload object to storage: ${error.message}`
            );
            throw error;
        }
    }

    getPublicUrl(key: string): string {
        const { data } = this.client.storage
            .from(this.bucket)
            .getPublicUrl(key);

        return data.publicUrl;
    }
}
