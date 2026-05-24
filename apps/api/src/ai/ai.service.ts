import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AIDecision, AIAction, DomainEvent } from '@motor100/shared';

// TODO: Implementar integração com OpenRouter
// - System prompt com regras do negócio
// - Contexto das últimas N mensagens
// - Structured output { action, reason, message }
// - Interface AIProvider pra trocar provider

export interface AIProvider {
  generateResponse(conversationId: string, messages: any[]): Promise<AIDecision>;
}

@Injectable()
export class AiService implements AIProvider {
  private readonly logger = new Logger(AiService.name);

  async generateResponse(conversationId: string, messages: any[]): Promise<AIDecision> {
    this.logger.log(`Generating AI response for conversation ${conversationId}`);
    // TODO: Chamar OpenRouter API
    return {
      action: AIAction.RESPOND,
      reason: 'stub',
      message: 'Resposta stub da IA — implementar OpenRouter',
    };
  }

  @OnEvent(DomainEvent.MESSAGE_RECEIVED)
  async handleMessage(payload: { conversation: any; message: any }) {
    if (payload.conversation.ownerType !== 'ai') return;
    this.logger.log(`AI processing message for conversation ${payload.conversation.id}`);
    // TODO: Gerar resposta e enviar via ChannelSender
  }
}
