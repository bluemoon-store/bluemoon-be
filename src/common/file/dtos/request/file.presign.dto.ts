import { ENUM_FILE_STORE } from '../../enums/files.enum';

export class FilePresignDto {
    fileName: string;

    storeType: ENUM_FILE_STORE;

    contentType: string;
}
