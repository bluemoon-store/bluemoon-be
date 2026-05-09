import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { FilePresignDto } from '../dtos/request/file.presign.dto';
import { ENUM_FILE_STORE } from '../enums/files.enum';
import { SupabaseStorageService } from '../../storage/services/supabase.storage.service';

@Injectable()
export class FileService {
    constructor(
        private readonly storageService: SupabaseStorageService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(FileService.name);
    }

    private slugifyName(fileName: string): string {
        return fileName
            .toLowerCase()
            .replace(/[^a-z0-9.]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    async getPresignUrlPutObject(userId: string, dto: FilePresignDto) {
        const key = `${userId}/${dto.storeType}/${Date.now()}_${dto.fileName}`;

        return this.storageService.getPresignedUploadUrl(key, dto.contentType);
    }

    /**
     * Server-side upload to the public assets bucket (SUPABASE_STORAGE_BUCKET_PUBLIC_ASSETS).
     */
    async uploadPublicAsset(
        adminUserId: string,
        file: Express.Multer.File
    ): Promise<{ key: string; url: string }> {
        const safeName = this.slugifyName(file.originalname || 'asset');
        const key = `${adminUserId}/${ENUM_FILE_STORE.PUBLIC_ASSETS}/${Date.now()}_${safeName}`;

        await this.storageService.uploadObject(
            key,
            file.buffer,
            file.mimetype,
            'publicAssets'
        );

        const url = this.storageService.getPublicUrl(key, 'publicAssets');

        this.logger.info({ key }, 'Public asset uploaded');

        return { key, url };
    }
}
