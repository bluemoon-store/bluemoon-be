import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class FilePutPresignResponseDto {
    @ApiProperty({
        example:
            'https://s3.amazonaws.com/finance-department-bucket/2022/tax-certificate.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA3SGQVQG7FGA6KKA6%2F20221104%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20221104T140227Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=b228dbec8c1008c80c162e1210e4503dceead1e4d4751b4d9787314fd6da4d55',
        required: true,
        nullable: false,
    })
    @Expose()
    @IsString()
    url: string;

    @ApiProperty({
        example: 1200,
        required: true,
        nullable: false,
    })
    @Expose()
    @IsNumber()
    expiresIn: number;
}

export class FileUploadResponseDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: true,
        nullable: false,
        description: 'Image ID from database',
    })
    @Expose()
    @IsString()
    id: string;

    @ApiProperty({
        example: 'user-123/energy-map-images/1735123456789_image.jpg',
        required: true,
        nullable: false,
        description: 'S3 key of the uploaded file',
    })
    @Expose()
    @IsString()
    key: string;

    @ApiProperty({
        example:
            'https://my-bucket.s3.us-east-1.amazonaws.com/user-123/energy-map-images/1735123456789_image.jpg',
        required: true,
        nullable: false,
        description: 'Public URL of the uploaded file',
    })
    @Expose()
    @IsString()
    url: string;

    @ApiProperty({
        example: 'image/jpeg',
        required: true,
        nullable: false,
        description: 'Content type of the uploaded file',
    })
    @Expose()
    @IsString()
    contentType: string;
}
