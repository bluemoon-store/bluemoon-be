import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { AwsS3Service } from 'src/common/aws/services/aws.s3.service';
import { DatabaseService } from 'src/common/database/services/database.service';

import { FilePresignDto } from '../dtos/request/file.presign.dto';
import {
    FilePutPresignResponseDto,
    FileUploadResponseDto,
} from '../dtos/response/file.response.dto';
import { ENUM_FILE_STORE } from '../enums/files.enum';
import { IFilesServiceInterface } from '../interfaces/files.service.interface';

@Injectable()
export class FileService implements IFilesServiceInterface {
    constructor(
        private readonly awsS3Service: AwsS3Service,
        private readonly databaseService: DatabaseService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(FileService.name);
    }

    async getPresignUrlPutObject(
        userId: string,
        { fileName, storeType, contentType }: FilePresignDto
    ): Promise<FilePutPresignResponseDto> {
        try {
            const key = `${userId}/${storeType}/${Date.now()}_${fileName}`;

            const { url, expiresIn } =
                await this.awsS3Service.getPresignedUploadUrl(key, contentType);

            this.logger.info(
                { userId, fileName, storeType },
                'Generated presigned URL for file upload'
            );

            return { url, expiresIn };
        } catch (error) {
            this.logger.error(
                `Failed to generate presigned URL: ${error.message}`
            );
            throw error;
        }
    }

    async uploadFile(
        userId: string,
        file: Express.Multer.File,
        storeType: ENUM_FILE_STORE
    ): Promise<FileUploadResponseDto> {
        try {
            const fileName = file.originalname;
            const key = `${userId}/${storeType}/${Date.now()}_${fileName}`;
            const contentType = file.mimetype;

            // Upload to S3
            await this.awsS3Service.uploadObject(key, file.buffer, contentType);

            // Get public URL
            const url = this.awsS3Service.getPublicUrl(key);

            // Save to database
            const image = await this.databaseService.image.create({
                data: {
                    key,
                    url,
                    contentType,
                    userId,
                },
            });

            this.logger.info(
                { userId, imageId: image.id, key, storeType, contentType },
                'File uploaded and saved to database successfully'
            );

            return {
                id: image.id,
                key: image.key,
                url: image.url || url,
                contentType: image.contentType,
            };
        } catch (error) {
            this.logger.error(
                `Failed to upload file: ${error.message}`,
                error.stack
            );
            throw error;
        }
    }
}
