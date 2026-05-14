import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { PinoLogger } from 'nestjs-pino';

import { EMAIL_TEMPLATES } from 'src/common/email/enums/email-template.enum';
import {
    IVerifyEmailPayload,
    ISendEmailBasePayload,
} from 'src/common/helper/interfaces/email.interface';
import { HelperEmailService } from 'src/common/helper/services/helper.email.service';
import { EmailProcessorWorker } from 'src/workers/processors/email.processor';

describe('EmailProcessorWorkerService', () => {
    let service: EmailProcessorWorker;
    let helperEmailServiceMock: jest.Mocked<HelperEmailService>;
    let loggerMock: jest.Mocked<PinoLogger>;

    beforeEach(async () => {
        helperEmailServiceMock = {
            sendEmail: jest.fn(),
        } as unknown as jest.Mocked<HelperEmailService>;

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
                EmailProcessorWorker,
                {
                    provide: HelperEmailService,
                    useValue: helperEmailServiceMock,
                },
                { provide: PinoLogger, useValue: loggerMock },
            ],
        }).compile();

        service = module.get<EmailProcessorWorker>(EmailProcessorWorker);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('processVerifyEmail', () => {
        it('should process the verify-email job and call sendEmail', async () => {
            const jobData: ISendEmailBasePayload<IVerifyEmailPayload> = {
                toEmails: ['test@example.com'],
                data: { verification_link: 'https://jinx.to/verify?token=x' },
            };
            const jobMock = { data: jobData } as Job<
                ISendEmailBasePayload<IVerifyEmailPayload>
            >;

            await service.processVerifyEmail(jobMock);

            expect(helperEmailServiceMock.sendEmail).toHaveBeenCalledWith({
                emails: jobData.toEmails,
                emailType: EMAIL_TEMPLATES.VERIFY_EMAIL,
                payload: jobData.data,
            });
        });
    });
});
