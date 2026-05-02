import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';

import { TicketAttachmentPresignDto } from '../dtos/request/ticket-attachment.presign.request';
import { TicketCreateDto } from '../dtos/request/ticket.create.request';
import { TicketListQueryDto } from '../dtos/request/ticket-list.request';
import { TicketMessageCreateDto } from '../dtos/request/ticket-message.create.request';
import { TicketMessageResponseDto } from '../dtos/response/ticket-message.response';
import {
    TicketDetailResponseDto,
    TicketResponseDto,
} from '../dtos/response/ticket.response';
import { TicketPresignResponseDto } from '../dtos/response/ticket-presign.response';
import { TicketMessageService } from '../services/ticket-message.service';
import { TicketService } from '../services/ticket.service';

@ApiTags('public.ticket')
@Controller({
    path: '/tickets',
    version: '1',
})
export class TicketPublicController {
    constructor(
        private readonly ticketService: TicketService,
        private readonly ticketMessageService: TicketMessageService
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Create support ticket with initial message' })
    @DocResponse({
        serialization: TicketDetailResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'ticket.success.created',
    })
    public async createTicket(
        @AuthUser() user: IAuthUser,
        @Body() payload: TicketCreateDto
    ): Promise<TicketDetailResponseDto> {
        return this.ticketService.createTicket(user.userId, payload);
    }

    @Get()
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List my tickets' })
    @DocPaginatedResponse({
        serialization: TicketResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'ticket.success.list',
    })
    public async listTickets(
        @AuthUser() user: IAuthUser,
        @Query(new QueryTransformPipe()) query: TicketListQueryDto
    ): Promise<ApiPaginatedDataDto<TicketResponseDto>> {
        return this.ticketService.getUserTickets(user.userId, query);
    }

    @Post(':id/attachments/presign')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Presigned upload URL for ticket attachment' })
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

    @Get(':id')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get ticket detail' })
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
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Send message as customer' })
    @DocResponse({
        serialization: TicketMessageResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'ticket.success.messageSent',
    })
    public async sendMessage(
        @AuthUser() user: IAuthUser,
        @Param('id') ticketId: string,
        @Body() body: TicketMessageCreateDto
    ): Promise<TicketMessageResponseDto> {
        return this.ticketMessageService.sendCustomerMessage(
            ticketId,
            { userId: user.userId, role: user.role },
            body
        );
    }
}
