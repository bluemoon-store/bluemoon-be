import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';

import { EmailProviderService } from 'src/common/email/services/email-provider.service';

const mockSmtpSendMail = jest.fn();
const mockInit = jest.fn();

jest.mock('sendpulse-api', () => ({
    init: (...args: unknown[]) => mockInit(...args),
    smtpSendMail: (
        cb: (response: {
            result: boolean;
            id?: string;
            message?: string;
        }) => void,
        payload: unknown
    ) => mockSmtpSendMail(cb, payload),
}));

describe('EmailProviderService', () => {
    let service: EmailProviderService;
    let loggerMock: jest.Mocked<PinoLogger>;

    const mockConfigService = {
        getOrThrow: jest.fn((key: string) => {
            const config: Record<string, string> = {
                'email.sendpulse.apiUserId': 'sp_user_id',
                'email.sendpulse.apiSecret': 'sp_secret',
                'email.sendpulse.tokenStorage': '/tmp/',
                'email.fromEmail': 'default@example.com',
                'email.fromName': 'Bluemoon',
            };
            return config[key];
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
                EmailProviderService,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: PinoLogger, useValue: loggerMock },
            ],
        }).compile();

        service = module.get<EmailProviderService>(EmailProviderService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('send', () => {
        it('should return messageId on success', async () => {
            mockSmtpSendMail.mockImplementation((cb: any) =>
                cb({ result: true, id: 'sp_msg_abc' })
            );

            const result = await service.send({
                to: ['a@example.com'],
                subject: 'Hello',
                html: '<p>Hi</p>',
            });

            expect(result).toEqual({ messageId: 'sp_msg_abc' });
            expect(mockSmtpSendMail).toHaveBeenCalledTimes(1);

            const payload = mockSmtpSendMail.mock.calls[0][1];
            expect(payload).toEqual(
                expect.objectContaining({
                    subject: 'Hello',
                    html: '<p>Hi</p>',
                    text: 'Hi',
                    from: { name: 'Bluemoon', email: 'default@example.com' },
                    to: [{ email: 'a@example.com' }],
                })
            );
        });

        it('should throw when SendPulse returns result:false', async () => {
            mockSmtpSendMail.mockImplementation((cb: any) =>
                cb({ result: false, message: 'Invalid request' })
            );

            await expect(
                service.send({
                    to: ['a@example.com'],
                    subject: 'Hello',
                    html: '<p>Hi</p>',
                })
            ).rejects.toThrow('Invalid request');
        });

        it('should use from override when provided', async () => {
            mockSmtpSendMail.mockImplementation((cb: any) =>
                cb({ result: true, id: 'sp_msg_1' })
            );

            await service.send({
                from: 'custom@example.com',
                to: ['a@example.com'],
                subject: 'S',
                html: '<p>x</p>',
            });

            const payload = mockSmtpSendMail.mock.calls[0][1];
            expect(payload.from).toEqual({
                name: 'Bluemoon',
                email: 'custom@example.com',
            });
        });

        it('should pass reply_to when replyTo provided', async () => {
            mockSmtpSendMail.mockImplementation((cb: any) =>
                cb({ result: true, id: 'sp_msg_2' })
            );

            await service.send({
                to: ['a@example.com'],
                subject: 'S',
                html: '<p>x</p>',
                replyTo: 'support@example.com',
            });

            const payload = mockSmtpSendMail.mock.calls[0][1];
            expect(payload.reply_to).toBe('support@example.com');
        });

        it('should omit reply_to when not provided', async () => {
            mockSmtpSendMail.mockImplementation((cb: any) =>
                cb({ result: true, id: 'sp_msg_3' })
            );

            await service.send({
                to: ['a@example.com'],
                subject: 'S',
                html: '<p>x</p>',
            });

            const payload = mockSmtpSendMail.mock.calls[0][1];
            expect(payload.reply_to).toBeUndefined();
        });
    });
});
