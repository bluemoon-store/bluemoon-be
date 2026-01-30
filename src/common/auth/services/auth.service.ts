import { faker } from '@faker-js/faker';
import { InjectQueue } from '@nestjs/bull';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Queue } from 'bull';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';
import { AWS_SES_EMAIL_TEMPLATES } from 'src/common/aws/enums/aws.ses.enum';
import { DatabaseService } from 'src/common/database/services/database.service';
import {
    ISendEmailBasePayload,
    IWelcomeEmailDataPaylaod,
} from 'src/common/helper/interfaces/email.interface';

import { HelperEncryptionService } from '../../helper/services/helper.encryption.service';
import { IAuthUser } from '../../request/interfaces/request.interface';
import { UserService } from 'src/modules/user/services/user.service';
import { WalletService } from 'src/modules/wallet/services/wallet.service';
import { UserLoginDto } from '../dtos/request/auth.login.dto';
import { UserCreateDto } from '../dtos/request/auth.signup.dto';
import { TwoFactorSetupDto } from '../dtos/request/auth.2fa.setup.dto';
import { TwoFactorVerifyDto } from '../dtos/request/auth.2fa.verify.dto';
import {
    AuthRefreshResponseDto,
    AuthResponseDto,
} from '../dtos/response/auth.response.dto';
import {
    TwoFactorSetupResponseDto,
    TwoFactorVerifyResponseDto,
} from '../dtos/response/auth.2fa.response';
import { IAuthService } from '../interfaces/auth.service.interface';

@Injectable()
export class AuthService implements IAuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly helperEncryptionService: HelperEncryptionService,
        private readonly userService: UserService,
        private readonly walletService: WalletService,
        @InjectQueue(APP_BULL_QUEUES.EMAIL)
        private emailQueue: Queue,
        @InjectQueue(APP_BULL_QUEUES.NOTIFICATION)
        private notificationQueue: Queue
    ) {}

    public async login(data: UserLoginDto): Promise<AuthResponseDto> {
        try {
            const { email, password, twoFactorCode } = data;

            const user = await this.databaseService.user.findUnique({
                where: { email },
            });

            if (!user) {
                throw new HttpException(
                    'user.error.userNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Check if user is banned
            if (user.isBanned) {
                throw new HttpException(
                    'auth.error.userBanned',
                    HttpStatus.FORBIDDEN
                );
            }

            const passwordMatched = await this.helperEncryptionService.match(
                user.password,
                password
            );

            if (!passwordMatched) {
                throw new HttpException(
                    'auth.error.invalidPassword',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Check if 2FA is enabled
            if (user.twoFactorEnabled) {
                if (!twoFactorCode) {
                    throw new HttpException(
                        'auth.error.twoFactorRequired',
                        HttpStatus.BAD_REQUEST
                    );
                }

                if (!user.twoFactorSecret) {
                    throw new HttpException(
                        'auth.error.twoFactorNotConfigured',
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                // Verify TOTP code
                const verified = speakeasy.totp.verify({
                    secret: user.twoFactorSecret,
                    encoding: 'base32',
                    token: twoFactorCode,
                    window: 2, // Allow 2 time steps (60 seconds) tolerance
                });

                if (!verified) {
                    throw new HttpException(
                        'auth.error.invalidTwoFactorCode',
                        HttpStatus.BAD_REQUEST
                    );
                }
            }

            const tokens = await this.helperEncryptionService.createJwtTokens({
                role: user.role,
                userId: user.id,
            });

            return {
                ...tokens,
                user,
            };
        } catch (error) {
            throw error;
        }
    }

    public async signup(data: UserCreateDto): Promise<AuthResponseDto> {
        try {
            const { email, firstName, lastName, password, referralCode } = data;

            const existingUser = await this.databaseService.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                throw new HttpException(
                    'user.error.userExists',
                    HttpStatus.CONFLICT
                );
            }

            const hashed =
                await this.helperEncryptionService.createHash(password);

            const createdUser = await this.databaseService.user.create({
                data: {
                    email,
                    password: hashed,
                    firstName: firstName?.trim(),
                    lastName: lastName?.trim(),
                    role: Role.USER,
                    userName: faker.internet.username(),
                    referralCode: faker.string.alphanumeric(8).toUpperCase(),
                },
            });

            if (referralCode) {
                await this.userService.processReferral(
                    createdUser.id,
                    referralCode
                );
            }

            // Create wallet for new user
            await this.walletService.createWallet(createdUser.id);

            const tokens = await this.helperEncryptionService.createJwtTokens({
                role: createdUser.role,
                userId: createdUser.id,
            });

            // TODO: Uncomment this when the email service is ready
            // this.emailQueue.add(
            //     AWS_SES_EMAIL_TEMPLATES.WELCOME_EMAIL,
            //     {
            //         data: {
            //             userName: createdUser.userName,
            //         },
            //         toEmails: [email],
            //     } as ISendEmailBasePayload<IWelcomeEmailDataPaylaod>,
            //     { delay: 15000 }
            // );

            // Trigger welcome notification
            // this.notificationQueue.add('welcome', {
            //     userId: createdUser.id,
            // });

            return {
                ...tokens,
                user: createdUser,
            };
        } catch (error) {
            throw error;
        }
    }

    public async refreshTokens(
        payload: IAuthUser
    ): Promise<AuthRefreshResponseDto> {
        return this.helperEncryptionService.createJwtTokens({
            userId: payload.userId,
            role: payload.role,
        });
    }

    public async setupTwoFactor(
        userId: string,
        data: TwoFactorSetupDto
    ): Promise<TwoFactorSetupResponseDto> {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new HttpException(
                    'user.error.userNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Verify password
            const passwordMatched = await this.helperEncryptionService.match(
                user.password,
                data.password
            );

            if (!passwordMatched) {
                throw new HttpException(
                    'auth.error.invalidPassword',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Generate secret
            const secret = speakeasy.generateSecret({
                name: `Bluemoon (${user.email})`,
                issuer: 'Bluemoon',
                length: 32,
            });

            // Generate QR code
            const otpAuthUrl = speakeasy.otpauthURL({
                secret: secret.base32,
                label: user.email,
                issuer: 'Bluemoon',
                encoding: 'base32',
            });

            const qrCode = await QRCode.toDataURL(otpAuthUrl);

            // Store secret temporarily (user needs to verify before enabling)
            await this.databaseService.user.update({
                where: { id: userId },
                data: {
                    twoFactorSecret: secret.base32,
                },
            });

            return {
                secret: secret.base32,
                qrCode,
                otpAuthUrl,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'auth.error.failedToSetupTwoFactor',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    public async verifyTwoFactor(
        userId: string,
        data: TwoFactorVerifyDto
    ): Promise<TwoFactorVerifyResponseDto> {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new HttpException(
                    'user.error.userNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            if (!user.twoFactorSecret) {
                throw new HttpException(
                    'auth.error.twoFactorNotSetup',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Verify TOTP code
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: data.code,
                window: 2,
            });

            if (!verified) {
                throw new HttpException(
                    'auth.error.invalidTwoFactorCode',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Enable 2FA
            await this.databaseService.user.update({
                where: { id: userId },
                data: {
                    twoFactorEnabled: true,
                },
            });

            return {
                success: true,
                message: 'auth.success.twoFactorEnabled',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'auth.error.failedToVerifyTwoFactor',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    public async disableTwoFactor(
        userId: string,
        data: TwoFactorVerifyDto
    ): Promise<{ success: boolean; message: string }> {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new HttpException(
                    'user.error.userNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            if (!user.twoFactorEnabled || !user.twoFactorSecret) {
                throw new HttpException(
                    'auth.error.twoFactorNotEnabled',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Verify TOTP code before disabling
            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: data.code,
                window: 2,
            });

            if (!verified) {
                throw new HttpException(
                    'auth.error.invalidTwoFactorCode',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Disable 2FA and clear secret
            await this.databaseService.user.update({
                where: { id: userId },
                data: {
                    twoFactorEnabled: false,
                    twoFactorSecret: null,
                },
            });

            return {
                success: true,
                message: 'auth.success.twoFactorDisabled',
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'auth.error.failedToDisableTwoFactor',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
