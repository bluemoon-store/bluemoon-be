import {
    TicketAttachment,
    TicketMessage,
    SupportTicket,
    User,
    Order,
    TicketStatus,
} from '@prisma/client';

import {
    TicketAttachmentResponseDto,
    TicketMessageResponseDto,
    TicketMessageUserSnapshotDto,
} from './dtos/response/ticket-message.response';
import {
    TicketDetailResponseDto,
    TicketOrderSnapshotDto,
    TicketResponseDto,
    TicketUserSnapshotDto,
} from './dtos/response/ticket.response';

type MessageWithRelations = TicketMessage & {
    user?: Pick<
        User,
        | 'id'
        | 'userName'
        | 'firstName'
        | 'lastName'
        | 'avatar'
        | 'role'
        | 'email'
    >;
    attachments?: TicketAttachment[];
};

export function mapUserSnapshot(
    user: Pick<
        User,
        | 'id'
        | 'email'
        | 'userName'
        | 'firstName'
        | 'lastName'
        | 'avatar'
        | 'role'
    >
): TicketUserSnapshotDto {
    return {
        id: user.id,
        email: user.email,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
    };
}

export function mapOrderSnapshot(
    order: Pick<Order, 'id' | 'orderNumber' | 'status'>
): TicketOrderSnapshotDto {
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
    };
}

export function mapAttachment(
    a: TicketAttachment
): TicketAttachmentResponseDto {
    return {
        id: a.id,
        url: a.url,
        fileName: a.fileName,
        mimeType: a.mimeType,
        size: a.size,
        createdAt: a.createdAt,
    };
}

export function mapMessage(m: MessageWithRelations): TicketMessageResponseDto {
    const userSnap: TicketMessageUserSnapshotDto | undefined = m.user
        ? {
              id: m.user.id,
              userName: m.user.userName,
              firstName: m.user.firstName,
              lastName: m.user.lastName,
              avatar: m.user.avatar,
              role: m.user.role,
          }
        : undefined;

    return {
        id: m.id,
        ticketId: m.ticketId,
        userId: m.userId,
        message: m.message,
        isStaff: m.isStaff,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        user: userSnap,
        attachments: m.attachments?.map(mapAttachment),
    };
}

type TicketListRow = SupportTicket & {
    user?: Pick<
        User,
        | 'id'
        | 'email'
        | 'userName'
        | 'firstName'
        | 'lastName'
        | 'avatar'
        | 'role'
    >;
    assignedTo?: Pick<
        User,
        | 'id'
        | 'email'
        | 'userName'
        | 'firstName'
        | 'lastName'
        | 'avatar'
        | 'role'
    > | null;
    order?: Pick<Order, 'id' | 'orderNumber' | 'status'> | null;
    messages?: TicketMessage[];
};

export function mapTicketListItem(
    row: TicketListRow,
    unreadCount: number
): TicketResponseDto {
    const lastMsg =
        row.messages && row.messages.length > 0
            ? mapMessage({ ...row.messages[0], attachments: [] })
            : null;

    const base: TicketResponseDto = {
        id: row.id,
        ticketNumber: row.ticketNumber,
        subject: row.subject,
        status: row.status,
        priority: row.priority,
        userId: row.userId,
        orderId: row.orderId,
        assignedToId: row.assignedToId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        closedAt: row.closedAt,
        lastStaffReadAt: row.lastStaffReadAt,
        unreadCount,
        lastMessage: lastMsg,
    };

    if (row.user) {
        base.user = mapUserSnapshot(row.user);
    }
    if (row.assignedTo) {
        base.assignedTo = mapUserSnapshot(row.assignedTo);
    }
    if (row.order) {
        base.order = mapOrderSnapshot(row.order);
    }

    return base;
}

export function mapTicketDetail(
    row: SupportTicket & {
        user: Pick<
            User,
            | 'id'
            | 'email'
            | 'userName'
            | 'firstName'
            | 'lastName'
            | 'avatar'
            | 'role'
        >;
        assignedTo?: Pick<
            User,
            | 'id'
            | 'email'
            | 'userName'
            | 'firstName'
            | 'lastName'
            | 'avatar'
            | 'role'
        > | null;
        order?: Pick<Order, 'id' | 'orderNumber' | 'status'> | null;
        messages: MessageWithRelations[];
    },
    unreadCount: number
): TicketDetailResponseDto {
    return {
        id: row.id,
        ticketNumber: row.ticketNumber,
        subject: row.subject,
        status: row.status,
        priority: row.priority,
        userId: row.userId,
        orderId: row.orderId,
        assignedToId: row.assignedToId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        closedAt: row.closedAt,
        lastStaffReadAt: row.lastStaffReadAt,
        unreadCount,
        user: mapUserSnapshot(row.user),
        assignedTo: row.assignedTo ? mapUserSnapshot(row.assignedTo) : null,
        order: row.order ? mapOrderSnapshot(row.order) : null,
        messages: row.messages.map(mapMessage),
    };
}

export function tabToStatuses(
    tab?: 'pending' | 'active' | 'closed'
): TicketStatus[] | undefined {
    if (!tab) {
        return undefined;
    }
    if (tab === 'pending') {
        return [TicketStatus.OPEN];
    }
    if (tab === 'active') {
        return [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_USER];
    }
    return [TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.CANCELLED];
}
