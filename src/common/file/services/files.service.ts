import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { FilePresignDto } from '../dtos/request/file.presign.dto';
import { SupabaseStorageService } from '../../storage/services/supabase.storage.service';

@Injectable()
export class FileService {
    constructor(
        private readonly storageService: SupabaseStorageService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(FileService.name);
    }

    async getPresignUrlPutObject(userId: string, dto: FilePresignDto) {
        const key = `${userId}/${dto.storeType}/${Date.now()}_${dto.fileName}`;

        return this.storageService.getPresignedUploadUrl(key, dto.contentType);
    }
}
