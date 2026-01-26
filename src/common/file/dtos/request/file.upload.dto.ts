import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { ENUM_FILE_STORE } from '../../enums/files.enum';

export class FileUploadDto {
    @ApiProperty({
        example: ENUM_FILE_STORE.ENERGY_MAP_IMAGES,
        required: true,
        enum: ENUM_FILE_STORE,
        description: 'Type of storage location for the file (query parameter)',
    })
    @IsEnum(ENUM_FILE_STORE)
    @IsNotEmpty()
    storeType: ENUM_FILE_STORE;
}
