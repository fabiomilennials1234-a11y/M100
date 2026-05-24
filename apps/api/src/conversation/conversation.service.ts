import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConversationStatus,
  OwnerType,
  STATUS_OWNER_MAP,
  isValidTransition,
  DomainEvent,
} from '@motor100/shared';
import { Conversation, Prisma } from '@prisma/client';

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async findOrCreate(externalPhone: string): Promise<Conversation> {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        externalPhone,
        status: { not: 'encerrada' },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) return existing;

    const conversation = await this.prisma.conversation.create({
      data: { externalPhone },
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
      agentId: ownerType === OwnerType.AGENT ? agentId : null,
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

  async handleInboundMessage(externalPhone: string, content: string, type = 'text') {
    let conversation = await this.findOrCreate(externalPhone);

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
}
