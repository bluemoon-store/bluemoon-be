import { randomUUID } from 'crypto';

import { InjectQueue } from '@nestjs/bull';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { Queue } from 'bull';

import { APP_BULL_QUEUES } from 'src/app/enums/app.enum';
import { AcceptInvitationRequestDto } from 'src/common/auth/dtos/request/accept-invitation.request';
import { DatabaseService } from 'src/common/database/services/database.service';
import { EMAIL_TEMPLATES } from 'src/common/email/enums/email-template.enum';
import {
    ISendEmailBasePayload,
    ITeamInvitationPayload,
} from 'src/common/helper/interfaces/email.interface';
import { HelperEncryptionService } from 'src/common/helper/services/helper.encryption.service';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';

import { TeamInviteRequestDto } from '../dtos/request/team.invite.request';
import {
    TeamMemberStatus,
    TeamUpdateRequestDto,
} from '../dtos/request/team.update.request';

@Injectable()
export class UserTeamService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly helperEncryptionService: HelperEncryptionService,
        private readonly configService: ConfigService,
        @InjectQueue(APP_BULL_QUEUES.EMAIL)
        private readonly emailQueue: Queue
    ) {}

    public async listTeamMembers() {
        return this.databaseService.user.findMany({
            where: {
                role: { notIn: [Role.USER, Role.SUPER_ADMIN] },
            },
            select: {
                id: true,
                email: true,
                userName: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
                invitationTokenExpiry: true,
                invitedBy: true,
            },
            orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
        });
    }

    public async inviteTeamMember(
        payload: TeamInviteRequestDto,
        invitedByUserId: string
    ) {
        const existing = await this.databaseService.user.findUnique({
            where: { email: payload.email },
        });
        if (existing) {
            throw new HttpException(
                'user.error.userExists',
                HttpStatus.CONFLICT
            );
        }

        const inviter = await this.databaseService.user.findUnique({
            where: { id: invitedByUserId },
        });
        if (!inviter) {
            throw new HttpException(
                'user.error.userNotFound',
                HttpStatus.NOT_FOUND
            );
        }

        const invitationToken = randomUUID();
        const invitationTokenExpiry = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        const generatedPassword =
            await this.helperEncryptionService.createHash(randomUUID());
        const generatedUserName = `invited_${randomUUID().slice(0, 8)}`;

        const created = await this.databaseService.user.create({
            data: {
                email: payload.email,
                role: payload.role,
                userName: generatedUserName,
                password: generatedPassword,
                firstName: payload.name?.trim(),
                isVerified: false,
                invitedBy: invitedByUserId,
                invitationToken,
                invitationTokenExpiry,
            },
        });

        await this.sendInvitationEmail(
            created.email,
            inviter,
            payload.role,
            invitationToken
        );

        return created;
    }

    public async updateTeamMember(
        id: string,
        payload: TeamUpdateRequestDto
    ): Promise<ApiGenericResponseDto> {
        const user = await this.databaseService.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new HttpException(
                'user.error.userNotFound',
                HttpStatus.NOT_FOUND
            );
        }

        const data: {
            role?: Role;
            deletedAt?: Date | null;
        } = {};
        if (payload.role) {
            data.role = payload.role;
        }
        if (payload.status) {
            data.deletedAt =
                payload.status === TeamMemberStatus.DEACTIVATED
                    ? new Date()
                    : null;
        }

        await this.databaseService.user.update({
            where: { id },
            data,
        });

        return {
            success: true,
            message: 'user.success.updated',
        };
    }

    public async removeTeamMember(id: string): Promise<ApiGenericResponseDto> {
        const user = await this.databaseService.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new HttpException(
                'user.error.userNotFound',
                HttpStatus.NOT_FOUND
            );
        }

        await this.databaseService.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });

        return {
            success: true,
            message: 'user.success.deleted',
        };
    }

    public async resendInvite(id: string): Promise<ApiGenericResponseDto> {
        const user = await this.databaseService.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new HttpException(
                'user.error.userNotFound',
                HttpStatus.NOT_FOUND
            );
        }

        const inviter = user.invitedBy
            ? await this.databaseService.user.findUnique({
                  where: { id: user.invitedBy },
              })
            : null;

        const invitationToken = randomUUID();
        const invitationTokenExpiry = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        await this.databaseService.user.update({
            where: { id: user.id },
            data: {
                invitationToken,
                invitationTokenExpiry,
            },
        });

        await this.sendInvitationEmail(
            user.email,
            inviter ?? user,
            user.role,
            invitationToken
        );

        return {
            success: true,
            message: 'user.success.inviteResent',
        };
    }

    public async acceptInvitation(
        payload: AcceptInvitationRequestDto
    ): Promise<ApiGenericResponseDto> {
        const user = await this.databaseService.user.findFirst({
            where: {
                invitationToken: payload.token,
                deletedAt: null,
            },
        });
        if (!user) {
            throw new HttpException(
                'auth.error.invalidInvitationToken',
                HttpStatus.BAD_REQUEST
            );
        }

        if (
            !user.invitationTokenExpiry ||
            user.invitationTokenExpiry <= new Date()
        ) {
            throw new HttpException(
                'auth.error.invitationExpired',
                HttpStatus.BAD_REQUEST
            );
        }

        const existingUserName = await this.databaseService.user.findUnique({
            where: { userName: payload.userName },
        });
        if (existingUserName && existingUserName.id !== user.id) {
            throw new HttpException(
                'user.error.userNameExists',
                HttpStatus.CONFLICT
            );
        }

        const hashed = await this.helperEncryptionService.createHash(
            payload.password
        );

        await this.databaseService.user.update({
            where: { id: user.id },
            data: {
                userName: payload.userName.trim(),
                password: hashed,
                isVerified: true,
                invitationToken: null,
                invitationTokenExpiry: null,
                deletedAt: null,
            },
        });

        return {
            success: true,
            message: 'auth.success.invitationAccepted',
        };
    }

    private async sendInvitationEmail(
        email: string,
        inviter: {
            firstName: string | null;
            lastName: string | null;
            userName: string;
            email: string;
        },
        role: Role,
        token: string
    ): Promise<void> {
        const adminUrl =
            this.configService.get<string>('app.adminUrl') ??
            this.configService.get<string>('app.frontendUrl') ??
            'http://localhost:3000';
        const inviteLink = `${adminUrl.replace(/\/$/, '')}/accept-invitation?token=${token}`;

        const inviterName =
            [inviter.firstName, inviter.lastName].filter(Boolean).join(' ') ||
            inviter.userName ||
            inviter.email;

        this.emailQueue.add(EMAIL_TEMPLATES.TEAM_INVITATION, {
            data: {
                inviterName,
                role: role.toString(),
                inviteLink,
                expiresIn: '7 days',
            },
            toEmails: [email],
        } as ISendEmailBasePayload<ITeamInvitationPayload>);
    }
}
