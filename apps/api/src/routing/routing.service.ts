import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent } from '@motor100/shared';

// TODO: Implementar distribuição de conversas entre agentes
// - Round-robin ou least-busy
// - Respeitar maxConcurrent do agente
// - Respeitar availability (só online recebe)

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  @OnEvent(DomainEvent.HANDOFF_REQUESTED)
  async handleHandoff(payload: { conversation: any }) {
    this.logger.log(`Handoff requested for conversation ${payload.conversation.id}`);
    // TODO: Buscar agente disponível e atribuir via ConversationService.assignAgent()
  }
}
