import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, TracingProvider } from '@motor100/shared';
import { TRACING_PROVIDER } from './tracing.constants';

@Injectable()
export class EventListenerService {
  private readonly logger = new Logger(EventListenerService.name);

  constructor(
    @Inject(TRACING_PROVIDER) private readonly tracing: TracingProvider,
  ) {}

  @OnEvent(DomainEvent.CONVERSATION_OWNER_CHANGED)
  handleOwnerChanged(payload: { conversationId: string; from: string; to: string }) {
    try {
      const trace = this.tracing.startTrace(payload.conversationId, { event: 'owner_changed' });
      const span = trace.startSpan('owner_changed', { from: payload.from, to: payload.to });
      this.logger.log(`Owner changed: ${payload.from} → ${payload.to} [${payload.conversationId}]`);
      span.end();
      trace.end();
    } catch (error) {
      this.logger.error(`Failed to trace owner_changed: ${error}`);
    }
  }

  @OnEvent(DomainEvent.MESSAGE_SENT)
  handleMessageSent(payload: { conversationId: string; message: { id: string; direction: string } }) {
    try {
      const trace = this.tracing.startTrace(payload.conversationId, { event: 'message_sent' });
      const span = trace.startSpan('message_sent', { messageId: payload.message.id });
      this.logger.log(`Message sent: ${payload.message.id} [${payload.conversationId}]`);
      span.end();
      trace.end();
    } catch (error) {
      this.logger.error(`Failed to trace message_sent: ${error}`);
    }
  }

  @OnEvent(DomainEvent.HANDOFF_COMPLETED)
  handleHandoffCompleted(payload: { conversationId: string; agentId: string }) {
    try {
      const trace = this.tracing.startTrace(payload.conversationId, { event: 'handoff_completed' });
      const span = trace.startSpan('handoff_completed', { agentId: payload.agentId });
      this.logger.log(`Handoff completed: agent ${payload.agentId} [${payload.conversationId}]`);
      span.end();
      trace.end();
    } catch (error) {
      this.logger.error(`Failed to trace handoff_completed: ${error}`);
    }
  }

  @OnEvent(DomainEvent.AI_RESPONSE_GENERATED)
  handleAiResponseGenerated(payload: { conversation: { id: string }; decision: { action: string; reason: string } }) {
    try {
      const trace = this.tracing.startTrace(payload.conversation.id, { event: 'ai_response_generated' });
      const span = trace.startSpan('ai_response_generated', {
        action: payload.decision.action,
        reason: payload.decision.reason,
      });
      this.logger.log(`AI response: ${payload.decision.action} [${payload.conversation.id}]`);
      span.end();
      trace.end();
    } catch (error) {
      this.logger.error(`Failed to trace ai_response_generated: ${error}`);
    }
  }
}
