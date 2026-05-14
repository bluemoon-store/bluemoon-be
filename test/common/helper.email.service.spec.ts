import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as Handlebars from 'handlebars';
import { PinoLogger } from 'nestjs-pino';

import {
    EMAIL_TEMPLATES,
    EMAIL_TEMPLATE_SUBJECTS,
} from 'src/common/email/enums/email-template.enum';
import { ResendService } from 'src/common/email/services/resend.service';
import { ISendEmailParams } from 'src/common/helper/interfaces/email.interface';
import { HelperEmailService } from 'src/common/helper/services/helper.email.service';

jest.mock('fs', () => ({
    readFileSync: jest.fn(() => '<p>{{userName}}</p>'),
}));

jest.mock('handlebars', () => ({
    compile: jest.fn(
        () => (ctx: Record<string, unknown>) => `<p>${ctx.userName}</p>`
    ),
}));

describe('HelperEmailService', () => {
    let service: HelperEmailService;
    let resendServiceMock: jest.Mocked<Pick<ResendService, 'send'>>;
    let configServiceMock: jest.Mocked<Pick<ConfigService, 'get'>>;
    let loggerMock: jest.Mocked<PinoLogger>;
    let module: TestingModule;

    beforeEach(async () => {
        jest.clearAllMocks();

        resendServiceMock = {
            send: jest.fn().mockResolvedValue({ messageId: 'resend-id-1' }),
        };

        configServiceMock = {
            get: jest.fn().mockReturnValue(undefined),
        } as unknown as jest.Mocked<Pick<ConfigService, 'get'>>;

        loggerMock = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn(),
            fatal: jest.fn(),
            setContext: jest.fn(),
        } as unknown as jest.Mocked<PinoLogger>;

        module = await Test.createTestingModule({
            providers: [
                HelperEmailService,
                { provide: ResendService, useValue: resendServiceMock },
                { provide: ConfigService, useValue: configServiceMock },
                { provide: PinoLogger, useValue: loggerMock },
            ],
        }).compile();

        service = module.get<HelperEmailService>(HelperEmailService);
    });

    afterEach(async () => {
        if (module) {
            await module.close();
        }
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sendEmail', () => {
        const baseParams: ISendEmailParams = {
            emailType: EMAIL_TEMPLATES.VERIFY_EMAIL,
            emails: ['user@example.com'],
            payload: { userName: 'Ada' },
        };

        it('should render template and send via Resend', async () => {
            const result = await service.sendEmail(baseParams);

            expect(result).toEqual({ messageId: 'resend-id-1' });
            expect(Handlebars.compile).toHaveBeenCalled();
            expect(resendServiceMock.send).toHaveBeenCalledWith({
                to: baseParams.emails,
                subject: EMAIL_TEMPLATE_SUBJECTS.VERIFY_EMAIL,
                html: '<p>Ada</p>',
            });
        });

        it('should throw when Resend send fails', async () => {
            resendServiceMock.send.mockRejectedValue(new Error('send failed'));

            await expect(service.sendEmail(baseParams)).rejects.toThrow(
                'send failed'
            );
        });

        it('should handle multiple recipients', async () => {
            await service.sendEmail({
                ...baseParams,
                emails: ['a@example.com', 'b@example.com'],
            });

            expect(resendServiceMock.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: ['a@example.com', 'b@example.com'],
                })
            );
        });

        it('should treat null payload as empty object for rendering', async () => {
            await service.sendEmail({ ...baseParams, payload: null as any });

            expect(resendServiceMock.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: '<p>undefined</p>',
                })
            );
        });

        it('should treat undefined payload as empty object', async () => {
            await service.sendEmail({
                ...baseParams,
                payload: undefined as any,
            });

            expect(resendServiceMock.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: '<p>undefined</p>',
                })
            );
        });
    });
});
