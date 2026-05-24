import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { ConversationService } from '../conversation/conversation.service';
import { AiService } from '../ai/ai.service';
import { ChannelService } from '../channel/channel.service';
import { AIAction, DomainEvent } from '@motor100/shared';
import { PrismaService } from '../prisma/prisma.service';

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
    @InjectQueue('message-processing') private readonly queue: Queue,
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

    const { conversation } = await this.conversationService.handleInboundMessage(
      phone, content, 'text',
    );

    const decision = await this.aiService.processMessage(conversation.id);

    if (decision.action === AIAction.RESPOND && decision.message) {
      await this.channelService.send({
        to: phone,
        content: decision.message,
        type: 'text',
      });
    } else if (decision.action === AIAction.HANDOFF) {
      await this.conversationService.requestHandoff(conversation.id);
    }
  }
}
