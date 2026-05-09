import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';

import { FilePresignDto } from 'src/common/file/dtos/request/file.presign.dto';
import { ENUM_FILE_STORE } from 'src/common/file/enums/files.enum';
import { FileService } from 'src/common/file/services/files.service';
import { SupabaseStorageService } from 'src/common/storage/services/supabase.storage.service';

describe('FileService', () => {
    let service: FileService;
    let storageService: jest.Mocked<SupabaseStorageService>;
    let loggerMock: jest.Mocked<PinoLogger>;

    beforeEach(async () => {
        jest.useFakeTimers();

        const mockStorageService = {
            getPresignedUploadUrl: jest.fn().mockResolvedValue({
                url: 'https://test.supabase.co/storage/v1/object/upload/sign/bucket/k',
                expiresIn: 3600,
            }),
            uploadObject: jest.fn().mockResolvedValue(undefined),
            getPublicUrl: jest
                .fn()
                .mockReturnValue(
                    'https://test.supabase.co/storage/v1/object/public/public-bucket/u/k/f.png'
                ),
        };

        loggerMock = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn(),
            fatal: jest.fn(),
            setContext: jest.fn(),
        } as unknown as jest.Mocked<PinoLogger>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FileService,
                {
                    provide: SupabaseStorageService,
                    useValue: mockStorageService,
                },
                {
                    provide: PinoLogger,
                    useValue: loggerMock,
                },
            ],
        }).compile();

        service = module.get<FileService>(FileService);
        storageService = module.get<SupabaseStorageService>(
            SupabaseStorageService
        ) as jest.Mocked<SupabaseStorageService>;
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe('getPresignUrlPutObject', () => {
        const mockPresignDto: FilePresignDto = {
            fileName: 'test.jpg',
            storeType: ENUM_FILE_STORE.PUBLIC_ASSETS,
            contentType: 'image/jpeg',
        };
        const mockUserId = 'user123';
        const mockUrl =
            'https://test.supabase.co/storage/v1/object/upload/sign/bucket/presigned';

        it('should generate a pre-signed URL successfully', async () => {
            storageService.getPresignedUploadUrl.mockResolvedValue({
                url: mockUrl,
                expiresIn: 3600,
            });

            const result = await service.getPresignUrlPutObject(
                mockUserId,
                mockPresignDto
            );

            expect(result).toEqual({
                url: mockUrl,
                expiresIn: 3600,
            });

            expect(storageService.getPresignedUploadUrl).toHaveBeenCalledWith(
                expect.stringMatching(
                    new RegExp(
                        `^${mockUserId}/${mockPresignDto.storeType}/\\d+_${mockPresignDto.fileName}$`
                    )
                ),
                mockPresignDto.contentType
            );
        });

        it('should throw an error if generating pre-signed URL fails', async () => {
            const mockError = new Error('Failed to generate URL');
            storageService.getPresignedUploadUrl.mockRejectedValue(mockError);

            await expect(
                service.getPresignUrlPutObject(mockUserId, mockPresignDto)
            ).rejects.toThrow(mockError);
        });

        it('should use correct content type', async () => {
            storageService.getPresignedUploadUrl.mockResolvedValue({
                url: mockUrl,
                expiresIn: 3600,
            });

            await service.getPresignUrlPutObject(mockUserId, mockPresignDto);

            expect(storageService.getPresignedUploadUrl).toHaveBeenCalledWith(
                expect.any(String),
                'image/jpeg'
            );
        });
    });

    describe('uploadPublicAsset', () => {
        const adminId = 'admin-1';
        const mockFile = {
            originalname: 'My Banner.PNG',
            mimetype: 'image/png',
            buffer: Buffer.from('x'),
            size: 100,
        } as Express.Multer.File;

        it('should upload to public assets bucket and return key and url', async () => {
            const publicUrl =
                'https://test.supabase.co/storage/v1/object/public/b/admin/k.png';

            storageService.uploadObject.mockResolvedValue(undefined);
            storageService.getPublicUrl.mockReturnValue(publicUrl);

            const result = await service.uploadPublicAsset(adminId, mockFile);

            expect(result.url).toBe(publicUrl);
            expect(result.key).toMatch(
                new RegExp(
                    `^${adminId}/${ENUM_FILE_STORE.PUBLIC_ASSETS}/\\d+_my-banner\\.png$`
                )
            );

            expect(storageService.uploadObject).toHaveBeenCalledWith(
                result.key,
                mockFile.buffer,
                'image/png',
                'publicAssets'
            );
            expect(storageService.getPublicUrl).toHaveBeenCalledWith(
                result.key,
                'publicAssets'
            );
        });
    });
});
