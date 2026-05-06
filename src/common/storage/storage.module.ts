import { Module } from '@nestjs/common';

import { SupabaseStorageService } from './services/supabase.storage.service';
import { WatermarkService } from './services/watermark.service';

@Module({
    providers: [SupabaseStorageService, WatermarkService],
    exports: [SupabaseStorageService, WatermarkService],
})
export class StorageModule {}
