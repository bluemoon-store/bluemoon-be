import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AdminFileUploadResponseDto {
    @ApiProperty({ description: 'Object path within the bucket' })
    @Expose()
    key: string;

    @ApiProperty({ description: 'Public URL for the uploaded file' })
    @Expose()
    url: string;
}
