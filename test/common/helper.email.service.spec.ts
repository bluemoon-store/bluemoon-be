import { Test, TestingModule } from '@nestjs/testing';
import * as Handlebars from 'handlebars';
import { PinoLogger } from 'nestjs-pino';

import {
    EMAIL_TEMPLATES,
    EMAIL_TEMPLATE_SUBJECTS,
} from 'src/common/email/enums/email-template.enum';
import { EmailProviderService } from 'src/common/email/services/email-provider.service';
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
    let emailProviderMock: jest.Mocked<Pick<EmailProviderService, 'send'>>;
    let loggerMock: jest.Mocked<PinoLogger>;
    let module: TestingModule;

    beforeEach(async () => {
        jest.clearAllMocks();

        emailProviderMock = {
            send: jest.fn().mockResolvedValue({ messageId: 'sp-id-1' }),
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

        module = await Test.createTestingModule({
            providers: [
                HelperEmailService,
                { provide: EmailProviderService, useValue: emailProviderMock },
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
            emailType: EMAIL_TEMPLATES.WELCOME_EMAIL,
            emails: ['user@example.com'],
            payload: { userName: 'Ada' },
        };

        it('should render template and send via email provider', async () => {
            const result = await service.sendEmail(baseParams);

            expect(result).toEqual({ messageId: 'sp-id-1' });
            expect(Handlebars.compile).toHaveBeenCalled();
            expect(emailProviderMock.send).toHaveBeenCalledWith({
                to: baseParams.emails,
                subject: EMAIL_TEMPLATE_SUBJECTS.WELCOME_EMAIL,
                html: '<p>Ada</p>',
            });
        });

        it('should throw when email provider send fails', async () => {
            emailProviderMock.send.mockRejectedValue(new Error('send failed'));

            await expect(service.sendEmail(baseParams)).rejects.toThrow(
                'send failed'
            );
        });

        it('should handle multiple recipients', async () => {
            await service.sendEmail({
                ...baseParams,
                emails: ['a@example.com', 'b@example.com'],
            });

            expect(emailProviderMock.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: ['a@example.com', 'b@example.com'],
                })
            );
        });

        it('should treat null payload as empty object for rendering', async () => {
            await service.sendEmail({ ...baseParams, payload: null as any });

            expect(emailProviderMock.send).toHaveBeenCalledWith(
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

            expect(emailProviderMock.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: '<p>undefined</p>',
                })
            );
        });
    });
});
