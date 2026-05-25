import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import {
  AIAction, DomainEvent, TracingProvider, RoutingPort,
  ROUTING_PORT, CONVERSATION_PORT, AI_PORT, CHANNEL_PORT, GUARDRAIL_PORT, SUMMARY_PORT,
  ConversationPort, AIProvider, ChannelSender, GuardrailPort, SummaryPort,
} from '@motor100/shared';
import { TRACING_PROVIDER } from '../tracing/tracing.constants';

const SUMMARY_THRESHOLD = 10;

@Injectable()
export class MessageProcessorService {
  private readonly logger = new Logger(MessageProcessorService.name);

  static readonly QUEUE_CONFIG = {
    name: 'message-processing',
  };

  constructor(
    @Inject(CONVERSATION_PORT) private readonly conversation: ConversationPort,
    @Inject(AI_PORT) private readonly ai: AIProvider,
    @Inject(CHANNEL_PORT) private readonly channel: ChannelSender,
    @Inject(GUARDRAIL_PORT) private readonly guardrail: GuardrailPort,
    @Inject(SUMMARY_PORT) private readonly summary: SummaryPort,
    @InjectQueue('message-processing') private readonly queue: Queue,
    @Inject(TRACING_PROVIDER) private readonly tracing: TracingProvider,
    private readonly events: EventEmitter2,
    @Inject(ROUTING_PORT) private readonly routing: RoutingPort,
  ) {}

  @OnEvent(DomainEvent.DEBOUNCE_FLUSHED)
  async handleDebounceFlushed(payload: { phone: string; content: string }) {
    await this.queue.add(
      'process-message',
      {
        phone: payload.phone,
        content: payload.content,
        timestamp: Date.now(),
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  async processJob(job: Job<{ phone: string; content: string }>) {
    const { phone, content } = job.data;
    const trace = this.tracing.startTrace(`job-${job.id}`, { phone });

    try {
      const spanGuardrailIn = trace.startSpan('guardrail.sanitizeInput');
      const sanitized = this.guardrail.sanitizeInput(content);
      spanGuardrailIn.end({ piiRedacted: sanitized.piiRedacted, injectionFlagged: sanitized.injectionFlagged });

      if (sanitized.injectionFlagged) {
        this.logger.warn(`Injection attempt detected from ${phone}: ${sanitized.flags}`);
      }

      const spanConversation = trace.startSpan('conversation.handleInbound');
      const { conversation } = await this.conversation.handleInboundMessage(
        phone, sanitized.sanitized, 'text',
      );
      spanConversation.end({ conversationId: conversation.id, status: conversation.status });

      const messageCount = (conversation.summaryMessageCount ?? 0) + 1;
      if (messageCount % SUMMARY_THRESHOLD === 0) {
        this.summary.generateProgressiveSummary(conversation.id).catch(err =>
          this.logger.error(`Progressive summary failed: ${err}`),
        );
      }

      const spanAi = trace.startSpan('ai.processMessage', { conversationId: conversation.id });
      const decision = await this.ai.processMessage(conversation.id);
      spanAi.end({ action: decision.action, reason: decision.reason });

      this.events.emit(DomainEvent.AI_RESPONSE_GENERATED, { conversation, decision });

      if (decision.action === AIAction.RESPOND && decision.message) {
        const spanGuardrailOut = trace.startSpan('guardrail.validateOutput');
        const validation = this.guardrail.validateOutput(decision.message);
        spanGuardrailOut.end({ valid: validation.valid, action: validation.action });

        if (!validation.valid) {
          this.logger.warn(`Output guardrail blocked: ${validation.reason}`);
          const spanHandoff = trace.startSpan('conversation.handoff');
          await this.conversation.requestHandoff(conversation.id);

          const routingResult = await this.routing.assignBestAgent(conversation.id);
          if (routingResult.assigned) {
            await this.conversation.assignAgent(conversation.id, routingResult.agentId);
            this.events.emit(DomainEvent.HANDOFF_COMPLETED, {
              conversationId: conversation.id,
              agentId: routingResult.agentId,
            });
          }

          spanHandoff.end({ handoff: true, reason: validation.reason, assigned: routingResult.assigned });
          return;
        }

        const spanSend = trace.startSpan('channel.send');
        await this.channel.send({
          to: phone,
          content: decision.message,
          type: 'text',
        });
        spanSend.end({ sent: true });
      } else if (decision.action === AIAction.HANDOFF) {
        const spanHandoff = trace.startSpan('conversation.handoff');
        await this.conversation.requestHandoff(conversation.id);

        const spanRouting = trace.startSpan('routing.assignBestAgent');
        const routingResult = await this.routing.assignBestAgent(conversation.id);
        spanRouting.end(routingResult);

        if (routingResult.assigned) {
          await this.conversation.assignAgent(conversation.id, routingResult.agentId);
          this.events.emit(DomainEvent.HANDOFF_COMPLETED, {
            conversationId: conversation.id,
            agentId: routingResult.agentId,
          });
        }

        spanHandoff.end({ handoff: true, assigned: routingResult.assigned });
      }
    } finally {
      trace.end();
    }
  }
}
