import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';

import { SupabaseStorageService } from 'src/common/storage/services/supabase.storage.service';

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(),
}));

describe('SupabaseStorageService', () => {
    let service: SupabaseStorageService;
    let loggerMock: jest.Mocked<PinoLogger>;
    let mockCreateSignedUploadUrl: jest.Mock;
    let mockUpload: jest.Mock;
    let mockGetPublicUrl: jest.Mock;
    let mockFrom: jest.Mock;

    const mockConfig = {
        'supabase.url': 'https://test.supabase.co',
        'supabase.serviceRoleKey': 'test-service-role',
        'supabase.storage.bucket': 'test-bucket',
        'supabase.storage.presignExpires': 3600,
    };

    beforeEach(async () => {
        mockCreateSignedUploadUrl = jest.fn();
        mockUpload = jest.fn();
        mockGetPublicUrl = jest.fn();

        mockFrom = jest.fn().mockReturnValue({
            createSignedUploadUrl: mockCreateSignedUploadUrl,
            upload: mockUpload,
            getPublicUrl: mockGetPublicUrl,
        });

        (createClient as jest.Mock).mockReturnValue({
            storage: {
                from: mockFrom,
            },
        });

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
                SupabaseStorageService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string, defaultValue?: unknown) => {
                            return mockConfig[key] ?? defaultValue;
                        }),
                    },
                },
                {
                    provide: PinoLogger,
                    useValue: loggerMock,
                },
            ],
        }).compile();

        service = module.get<SupabaseStorageService>(SupabaseStorageService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should initialize Supabase client with correct configuration', () => {
        expect(createClient).toHaveBeenCalledWith(
            'https://test.supabase.co',
            'test-service-role',
            expect.objectContaining({
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                },
            })
        );

        expect(loggerMock.info).toHaveBeenCalledWith(
            { bucket: 'test-bucket' },
            'Supabase storage service initialized'
        );
    });

    describe('getPresignedUploadUrl', () => {
        const signedUrl =
            'https://test.supabase.co/storage/v1/object/upload/sign/test-bucket/a?token=tok';

        beforeEach(() => {
            mockCreateSignedUploadUrl.mockResolvedValue({
                data: {
                    signedUrl,
                    path: 'a',
                    token: 'tok',
                },
                error: null,
            });
        });

        it('should generate presigned upload URL successfully', async () => {
            const key = 'user123/profile/test.jpg';
            const contentType = 'image/jpeg';

            const result = await service.getPresignedUploadUrl(
                key,
                contentType
            );

            expect(result).toEqual({
                url: signedUrl,
                expiresIn: 3600,
            });

            expect(mockFrom).toHaveBeenCalledWith('test-bucket');
            expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(key);

            expect(loggerMock.debug).toHaveBeenCalledWith(
                { key, contentType, expiresIn: 3600 },
                'Generated presigned upload URL'
            );
        });

        it('should cap expiration at 7200 seconds', async () => {
            const result = await service.getPresignedUploadUrl(
                'k',
                'image/jpeg',
                86400
            );

            expect(result.expiresIn).toBe(7200);
        });

        it('should use custom expiration when below cap', async () => {
            const result = await service.getPresignedUploadUrl(
                'k',
                'image/jpeg',
                1800
            );

            expect(result.expiresIn).toBe(1800);
        });

        it('should throw and log error on failure', async () => {
            const mockError = new Error('storage error');
            mockCreateSignedUploadUrl.mockResolvedValue({
                data: null,
                error: mockError,
            });

            await expect(
                service.getPresignedUploadUrl('test.jpg', 'image/jpeg')
            ).rejects.toThrow(mockError);

            expect(loggerMock.error).toHaveBeenCalledWith(
                'Failed to generate presigned URL: storage error'
            );
        });
    });

    describe('uploadObject', () => {
        beforeEach(() => {
            mockUpload.mockResolvedValue({ data: {}, error: null });
        });

        it('should upload object successfully with Buffer', async () => {
            const key = 'user123/documents/test.pdf';
            const body = Buffer.from('test content');
            const contentType = 'application/pdf';

            await service.uploadObject(key, body, contentType);

            expect(mockUpload).toHaveBeenCalledWith(key, body, {
                contentType,
                upsert: true,
            });

            expect(loggerMock.info).toHaveBeenCalledWith(
                { key, contentType },
                'Object uploaded to storage'
            );
        });

        it('should throw and log error on upload failure', async () => {
            const mockError = new Error('upload failed');
            mockUpload.mockResolvedValue({ data: null, error: mockError });

            await expect(
                service.uploadObject('k', Buffer.from('x'), 'image/jpeg')
            ).rejects.toThrow(mockError);

            expect(loggerMock.error).toHaveBeenCalledWith(
                'Failed to upload object to storage: upload failed'
            );
        });
    });

    describe('getPublicUrl', () => {
        it('should return public URL from client', () => {
            const publicUrl =
                'https://test.supabase.co/storage/v1/object/public/test-bucket/folder/x.png';
            mockGetPublicUrl.mockReturnValue({
                data: { publicUrl },
            });

            const url = service.getPublicUrl('folder/x.png');

            expect(url).toBe(publicUrl);
            expect(mockGetPublicUrl).toHaveBeenCalledWith('folder/x.png');
        });
    });
});
