import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConversationStatus,
  OwnerType,
  STATUS_OWNER_MAP,
  isValidTransition,
  DomainEvent,
  DEFAULT_CHANNEL_INSTANCE_ID,
} from '@motor100/shared';
import { Conversation, Prisma } from '@prisma/client';

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async findOrCreate(
    externalPhone: string,
    instanceId: string,
  ): Promise<Conversation> {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        externalPhone,
        status: { not: 'encerrada' },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) return existing;

    const conversation = await this.prisma.conversation.create({
      data: { externalPhone, instanceId },
    });

    this.events.emit(DomainEvent.CONVERSATION_CREATED, { conversation });
    return conversation;
  }

  async transition(
    conversationId: string,
    targetStatus: ConversationStatus,
    agentId?: string,
  ): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    const currentStatus = conversation.status as ConversationStatus;

    if (!isValidTransition(currentStatus, targetStatus)) {
      throw new BadRequestException(
        `Invalid transition: ${currentStatus} → ${targetStatus}`,
      );
    }

    const ownerType = STATUS_OWNER_MAP[targetStatus];

    if (ownerType === OwnerType.AGENT && !agentId) {
      throw new BadRequestException('agentId required for human assignment');
    }

    const data: Prisma.ConversationUpdateInput = {
      status: targetStatus,
      ownerType: ownerType,
      agent: ownerType === OwnerType.AGENT && agentId
        ? { connect: { id: agentId } }
        : { disconnect: true },
      version: { increment: 1 },
      closedAt: targetStatus === ConversationStatus.ENCERRADA ? new Date() : null,
    };

    try {
      const updated = await this.prisma.conversation.update({
        where: {
          id: conversationId,
          version: conversation.version,
        },
        data,
      });

      this.events.emit(DomainEvent.CONVERSATION_STATUS_CHANGED, {
        conversation: updated,
        from: currentStatus,
        to: targetStatus,
      });

      const previousOwner = conversation.ownerType;
      if (previousOwner !== ownerType) {
        this.events.emit(DomainEvent.CONVERSATION_OWNER_CHANGED, {
          conversationId: conversation.id,
          from: previousOwner,
          to: ownerType,
          conversation: updated,
        });
      }

      if (targetStatus === ConversationStatus.ENCERRADA) {
        this.events.emit(DomainEvent.CONVERSATION_CLOSED, { conversation: updated });
      }

      if (currentStatus === ConversationStatus.ENCERRADA && targetStatus === ConversationStatus.NOVA) {
        this.events.emit(DomainEvent.CONVERSATION_REOPENED, { conversation: updated });
      }

      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ConflictException('Conversation was modified concurrently — retry');
      }
      throw error;
    }
  }

  async handleInboundMessage(
    externalPhone: string,
    content: string,
    type = 'text',
    instanceId: string = DEFAULT_CHANNEL_INSTANCE_ID,
  ) {
    let conversation = await this.findOrCreate(externalPhone, instanceId);

    if (conversation.status === 'encerrada') {
      conversation = await this.transition(conversation.id, ConversationStatus.NOVA);
    }

    if (conversation.status === 'nova') {
      conversation = await this.transition(conversation.id, ConversationStatus.ATENDIDA_IA);
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'inbound',
        type: type as any,
        sender: 'customer',
        content,
      },
    });

    this.events.emit(DomainEvent.MESSAGE_RECEIVED, { conversation, message });
    return { conversation, message };
  }

  async requestHandoff(conversationId: string): Promise<Conversation> {
    const conversation = await this.transition(conversationId, ConversationStatus.NA_FILA);
    this.events.emit(DomainEvent.HANDOFF_REQUESTED, { conversation });
    return conversation;
  }

  async assignAgent(conversationId: string, agentId: string): Promise<Conversation> {
    const conversation = await this.transition(
      conversationId,
      ConversationStatus.ATENDIDA_HUMANO,
      agentId,
    );
    this.events.emit(DomainEvent.AGENT_ASSIGNED, { conversation, agentId });
    return conversation;
  }

  async returnToAi(conversationId: string): Promise<Conversation> {
    return this.transition(conversationId, ConversationStatus.ATENDIDA_IA);
  }

  async close(conversationId: string): Promise<Conversation> {
    return this.transition(conversationId, ConversationStatus.ENCERRADA);
  }

  async findById(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: { agent: true },
    });
  }

  async findMany(filter: { status?: string; ownerType?: string; agentId?: string }) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.ownerType) where.ownerType = filter.ownerType;
    if (filter.agentId) where.agentId = filter.agentId;

    return this.prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { agent: true },
    });
  }

  async getMessages(conversationId: string, take = 50, skip = 0) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take,
      skip,
    });
  }

  async getMetrics() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [active, queued, aiHandled, humanHandled, closedToday] = await Promise.all([
      this.prisma.conversation.count({ where: { status: { not: 'encerrada' } } }),
      this.prisma.conversation.count({ where: { status: 'na_fila' } }),
      this.prisma.conversation.count({ where: { ownerType: 'ai', status: { not: 'encerrada' } } }),
      this.prisma.conversation.count({ where: { ownerType: 'agent', status: { not: 'encerrada' } } }),
      this.prisma.conversation.count({ where: { status: 'encerrada', closedAt: { gte: startOfDay } } }),
    ]);

    return { active, queued, aiHandled, humanHandled, closedToday };
  }

  async handleOutboundMessage(conversationId: string, content: string, senderType: string) {
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        content,
        sender: senderType as any,
        direction: 'outbound',
        type: 'text',
      },
    });

    this.events.emit(DomainEvent.MESSAGE_SENT, { conversationId, message });
    return message;
  }
}
