import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module';

import { FileService } from './services/files.service';

@Module({
    imports: [StorageModule],
    providers: [FileService],
    exports: [FileService],
})
export class CommonFileModule {}
