import { FilePresignDto } from '../dtos/request/file.presign.dto';
import {
    FilePutPresignResponseDto,
    FileUploadResponseDto,
} from '../dtos/response/file.response.dto';
import { ENUM_FILE_STORE } from '../enums/files.enum';

export interface IFilesServiceInterface {
    getPresignUrlPutObject(
        userId: string,
        data: FilePresignDto
    ): Promise<FilePutPresignResponseDto>;

    uploadFile(
        userId: string,
        file: Express.Multer.File,
        storeType: ENUM_FILE_STORE
    ): Promise<FileUploadResponseDto>;
}
