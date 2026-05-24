import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { ConversationService } from '../conversation/conversation.service';
import { AiService } from '../ai/ai.service';
import { ChannelService } from '../channel/channel.service';
import { GuardrailService } from '../guardrail/guardrail.service';
import { SummaryService } from '../summary/summary.service';
import { AIAction, DomainEvent, TracingProvider } from '@motor100/shared';
import { TRACING_PROVIDER } from '../tracing/tracing.constants';

const SUMMARY_THRESHOLD = 10;

@Injectable()
export class MessageProcessorService {
  private readonly logger = new Logger(MessageProcessorService.name);

  static readonly QUEUE_CONFIG = {
    name: 'message-processing',
  };

  constructor(
    private readonly conversationService: ConversationService,
    private readonly aiService: AiService,
    private readonly channelService: ChannelService,
    private readonly guardrailService: GuardrailService,
    private readonly summaryService: SummaryService,
    @InjectQueue('message-processing') private readonly queue: Queue,
    @Inject(TRACING_PROVIDER) private readonly tracing: TracingProvider,
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
      const sanitized = this.guardrailService.sanitizeInput(content);
      spanGuardrailIn.end({ piiRedacted: sanitized.piiRedacted, injectionFlagged: sanitized.injectionFlagged });

      if (sanitized.injectionFlagged) {
        this.logger.warn(`Injection attempt detected from ${phone}: ${sanitized.flags}`);
      }

      const spanConversation = trace.startSpan('conversation.handleInbound');
      const { conversation } = await this.conversationService.handleInboundMessage(
        phone, sanitized.sanitized, 'text',
      );
      spanConversation.end({ conversationId: conversation.id, status: conversation.status });

      const messageCount = (conversation.summaryMessageCount ?? 0) + 1;
      if (messageCount % SUMMARY_THRESHOLD === 0) {
        this.summaryService.generateProgressiveSummary(conversation.id).catch(err =>
          this.logger.error(`Progressive summary failed: ${err}`),
        );
      }

      const spanAi = trace.startSpan('ai.processMessage', { conversationId: conversation.id });
      const decision = await this.aiService.processMessage(conversation.id);
      spanAi.end({ action: decision.action, reason: decision.reason });

      if (decision.action === AIAction.RESPOND && decision.message) {
        const spanGuardrailOut = trace.startSpan('guardrail.validateOutput');
        const validation = this.guardrailService.validateOutput(decision.message);
        spanGuardrailOut.end({ valid: validation.valid, action: validation.action });

        if (!validation.valid) {
          this.logger.warn(`Output guardrail blocked: ${validation.reason}`);
          const spanHandoff = trace.startSpan('conversation.handoff');
          await this.conversationService.requestHandoff(conversation.id);
          spanHandoff.end({ handoff: true, reason: validation.reason });
          return;
        }

        const spanSend = trace.startSpan('channel.send');
        await this.channelService.send({
          to: phone,
          content: decision.message,
          type: 'text',
        });
        spanSend.end({ sent: true });
      } else if (decision.action === AIAction.HANDOFF) {
        const spanHandoff = trace.startSpan('conversation.handoff');
        await this.conversationService.requestHandoff(conversation.id);
        spanHandoff.end({ handoff: true });
      }
    } finally {
      trace.end();
    }
  }
}
