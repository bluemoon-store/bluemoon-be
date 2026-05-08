import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SUPPORT_HANDLING_ROLES } from 'src/common/request/constants/roles.constant';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';
import { DocGenericResponse } from 'src/common/doc/decorators/doc.generic.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';

import { TicketAttachmentPresignDto } from '../dtos/request/ticket-attachment.presign.request';
import { TicketAdminListQueryDto } from '../dtos/request/ticket-list-admin.request';
import { TicketMessagesQueryDto } from '../dtos/request/ticket-messages.query';
import { TicketMessageCreateDto } from '../dtos/request/ticket-message.create.request';
import { TicketUpdateDto } from '../dtos/request/ticket.update.request';
import { TicketMessageResponseDto } from '../dtos/response/ticket-message.response';
import { TicketMessagesCursorResponseDto } from '../dtos/response/ticket-messages-cursor.response';
import { TicketPresignResponseDto } from '../dtos/response/ticket-presign.response';
import {
    TicketDetailResponseDto,
    TicketResponseDto,
} from '../dtos/response/ticket.response';
import { TicketMessageService } from '../services/ticket-message.service';
import { TicketService } from '../services/ticket.service';

@ApiTags('admin.ticket')
@Controller({
    path: '/admin/tickets',
    version: '1',
})
export class TicketAdminController {
    constructor(
        private readonly ticketService: TicketService,
        private readonly ticketMessageService: TicketMessageService
    ) {}

    @Get()
    @AllowedRoles(SUPPORT_HANDLING_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List all tickets (admin)' })
    @DocPaginatedResponse({
        serialization: TicketResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'ticket.success.list',
    })
    public async listTickets(
        @Query(new QueryTransformPipe()) query: TicketAdminListQueryDto
    ): Promise<ApiPaginatedDataDto<TicketResponseDto>> {
        return this.ticketService.getAllTickets(query);
    }

    @Get(':id/messages')
    @AllowedRoles(SUPPORT_HANDLING_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Paginated ticket messages (cursor)' })
    @DocResponse({
        serialization: TicketMessagesCursorResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'ticket.success.messagesList',
    })
    public async getMessages(
        @AuthUser() user: IAuthUser,
        @Param('id') ticketId: string,
        @Query(new QueryTransformPipe()) query: TicketMessagesQueryDto
    ): Promise<TicketMessagesCursorResponseDto> {
        return this.ticketMessageService.listMessages(
            ticketId,
            { userId: user.userId, role: user.role },
            { limit: query.limit, cursor: query.cursor }
        );
    }

    @Get(':id')
    @AllowedRoles(SUPPORT_HANDLING_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get ticket detail (admin)' })
    @DocResponse({
        serialization: TicketDetailResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'ticket.success.ticketFound',
    })
    public async getTicketDetail(
        @AuthUser() user: IAuthUser,
        @Param('id') ticketId: string
    ): Promise<TicketDetailResponseDto> {
        return this.ticketService.getTicketDetail(ticketId, {
            userId: user.userId,
            role: user.role,
        });
    }

    @Post(':id/messages')
    @HttpCode(HttpStatus.CREATED)
    @AllowedRoles(SUPPORT_HANDLING_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Staff reply' })
    @DocResponse({
        serialization: TicketMessageResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'ticket.success.messageSent',
    })
    public async sendStaffMessage(
        @AuthUser() user: IAuthUser,
        @Param('id') ticketId: string,
        @Body() body: TicketMessageCreateDto
    ): Promise<TicketMessageResponseDto> {
        return this.ticketMessageService.sendStaffMessage(
            ticketId,
            { userId: user.userId, role: user.role },
            body
        );
    }

    @Post(':id/attachments/presign')
    @AllowedRoles(SUPPORT_HANDLING_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Presigned upload URL (admin)' })
    @DocResponse({
        serialization: TicketPresignResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'ticket.success.presign',
    })
    public async presignAttachment(
        @AuthUser() user: IAuthUser,
        @Param('id') ticketId: string,
        @Body() body: TicketAttachmentPresignDto
    ): Promise<TicketPresignResponseDto> {
        return this.ticketService.presignAttachment(
            { userId: user.userId, role: user.role },
            ticketId,
            body
        );
    }

    @Patch(':id')
    @AllowedRoles(SUPPORT_HANDLING_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Update ticket status, priority, assignee' })
    @DocResponse({
        serialization: TicketResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'ticket.success.updated',
    })
    public async updateTicket(
        @AuthUser() user: IAuthUser,
        @Param('id') ticketId: string,
        @Body() body: TicketUpdateDto
    ): Promise<TicketResponseDto> {
        return this.ticketService.updateTicket(ticketId, body, {
            userId: user.userId,
            role: user.role,
        });
    }

    @Post(':id/read')
    @AllowedRoles(SUPPORT_HANDLING_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Mark ticket read by staff (unread badge)' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'ticket.success.markRead',
    })
    public async markRead(
        @Param('id') ticketId: string
    ): Promise<ApiGenericResponseDto> {
        await this.ticketService.markRead(ticketId);
        return {
            success: true,
            message: 'ticket.success.markRead',
        };
    }

    @Post(':id/close')
    @AllowedRoles(SUPPORT_HANDLING_ROLES)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Close ticket (convenience)' })
    @DocResponse({
        serialization: TicketResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'ticket.success.closed',
    })
    public async closeTicket(
        @AuthUser() user: IAuthUser,
        @Param('id') ticketId: string
    ): Promise<TicketResponseDto> {
        return this.ticketService.closeTicket(ticketId, {
            userId: user.userId,
            role: user.role,
        });
    }
}
