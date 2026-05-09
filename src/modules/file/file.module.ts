import { Module } from '@nestjs/common';

import { CommonFileModule } from 'src/common/file/file.module';

import { FileAdminController } from './controllers/file.admin.controller';

@Module({
    imports: [CommonFileModule],
    controllers: [FileAdminController],
})
export class FileModule {}
