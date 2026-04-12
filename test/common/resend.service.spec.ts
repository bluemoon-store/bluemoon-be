import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';

import { ResendService } from 'src/common/email/services/resend.service';

const mockEmailsSend = jest.fn();

jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
        emails: { send: mockEmailsSend },
    })),
}));

describe('ResendService', () => {
    let service: ResendService;
    let loggerMock: jest.Mocked<PinoLogger>;

    const mockConfigService = {
        getOrThrow: jest.fn((key: string) => {
            const config: Record<string, string> = {
                'resend.apiKey': 're_test_key',
                'resend.fromEmail': 'default@example.com',
            };
            return config[key];
        }),
        get: jest.fn((key: string) => {
            if (key === 'resend.testMode') return false;
            return undefined;
        }),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

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
                ResendService,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: PinoLogger, useValue: loggerMock },
            ],
        }).compile();

        service = module.get<ResendService>(ResendService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('send', () => {
        it('should return messageId on success', async () => {
            mockEmailsSend.mockResolvedValue({
                data: { id: 'msg_abc' },
                error: null,
            });

            const result = await service.send({
                to: ['a@example.com'],
                subject: 'Hello',
                html: '<p>Hi</p>',
            });

            expect(result).toEqual({ messageId: 'msg_abc' });
            expect(mockEmailsSend).toHaveBeenCalledWith({
                from: 'default@example.com',
                to: ['a@example.com'],
                subject: 'Hello',
                html: '<p>Hi</p>',
            });
        });

        it('should throw when Resend returns an error object', async () => {
            mockEmailsSend.mockResolvedValue({
                data: null,
                error: {
                    message: 'Invalid request',
                    statusCode: 422,
                    name: 'validation_error' as const,
                },
            });

            await expect(
                service.send({
                    to: ['a@example.com'],
                    subject: 'Hello',
                    html: '<p>Hi</p>',
                })
            ).rejects.toThrow('Invalid request');
        });

        it('should use from override when provided', async () => {
            mockEmailsSend.mockResolvedValue({
                data: { id: 'msg_1' },
                error: null,
            });

            await service.send({
                from: 'custom@example.com',
                to: ['a@example.com'],
                subject: 'S',
                html: '<p>x</p>',
            });

            expect(mockEmailsSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: 'custom@example.com',
                })
            );
        });

        it('should pass replyTo when provided', async () => {
            mockEmailsSend.mockResolvedValue({
                data: { id: 'msg_2' },
                error: null,
            });

            await service.send({
                to: ['a@example.com'],
                subject: 'S',
                html: '<p>x</p>',
                replyTo: 'support@example.com',
            });

            expect(mockEmailsSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    replyTo: 'support@example.com',
                })
            );
        });

        it('should omit replyTo when not provided', async () => {
            mockEmailsSend.mockResolvedValue({
                data: { id: 'msg_3' },
                error: null,
            });

            await service.send({
                to: ['a@example.com'],
                subject: 'S',
                html: '<p>x</p>',
            });

            const call = mockEmailsSend.mock.calls[0][0] as Record<
                string,
                unknown
            >;
            expect(call.replyTo).toBeUndefined();
        });

        describe('with testMode enabled', () => {
            beforeEach(async () => {
                (mockConfigService.get as jest.Mock).mockImplementation(
                    (key: string) =>
                        key === 'resend.testMode' ? true : undefined
                );

                const module: TestingModule = await Test.createTestingModule({
                    providers: [
                        ResendService,
                        {
                            provide: ConfigService,
                            useValue: mockConfigService,
                        },
                        { provide: PinoLogger, useValue: loggerMock },
                    ],
                }).compile();

                service = module.get<ResendService>(ResendService);
            });

            afterEach(() => {
                (mockConfigService.get as jest.Mock).mockImplementation(
                    (key: string) =>
                        key === 'resend.testMode' ? false : undefined
                );
            });

            it('redirects recipients to delivered+local@resend.dev', async () => {
                mockEmailsSend.mockResolvedValue({
                    data: { id: 'msg_test' },
                    error: null,
                });

                await service.send({
                    to: ['dinhnguyenkhanh@gmail.com', 'alice@company.io'],
                    subject: 'S',
                    html: '<p>x</p>',
                });

                expect(mockEmailsSend).toHaveBeenCalledWith(
                    expect.objectContaining({
                        to: [
                            'delivered+dinhnguyenkhanh@resend.dev',
                            'delivered+alice@resend.dev',
                        ],
                    })
                );
                expect(loggerMock.warn).toHaveBeenCalledWith(
                    'Resend test mode active — recipients will be redirected'
                );
            });
        });
    });
});
