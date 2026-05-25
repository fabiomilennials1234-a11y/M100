import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RoutingService } from './routing.service';
import { MessageProcessorService } from './message-processor.service';
import { MessageWorker } from './message.processor';
import { DeadLetterProcessor } from './dead-letter.processor';
import { ConversationModule } from '../conversation';
import { AiModule } from '../ai';
import { ChannelModule } from '../channel';
import { GuardrailModule } from '../guardrail';
import { SummaryModule } from '../summary';
import { AgentModule } from '../agent';
import {
  ROUTING_PORT, AGENT_PORT,
  CONVERSATION_PORT, AI_PORT, CHANNEL_PORT, GUARDRAIL_PORT, SUMMARY_PORT,
} from '@motor100/shared';
import { AgentService } from '../agent/agent.service';
import { ConversationService } from '../conversation/conversation.service';
import { AiService } from '../ai/ai.service';
import { ChannelService } from '../channel/channel.service';
import { GuardrailService } from '../guardrail/guardrail.service';
import { SummaryService } from '../summary/summary.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'routing' }),
    BullModule.registerQueue({ name: 'message-processing' }),
    BullModule.registerQueue({ name: 'message-processing-failed' }),
    ConversationModule,
    AiModule,
    ChannelModule,
    GuardrailModule,
    SummaryModule,
    AgentModule,
  ],
  providers: [
    RoutingService,
    MessageProcessorService,
    MessageWorker,
    DeadLetterProcessor,
    { provide: ROUTING_PORT, useExisting: RoutingService },
    { provide: AGENT_PORT, useExisting: AgentService },
    { provide: CONVERSATION_PORT, useExisting: ConversationService },
    { provide: AI_PORT, useExisting: AiService },
    { provide: CHANNEL_PORT, useExisting: ChannelService },
    { provide: GUARDRAIL_PORT, useExisting: GuardrailService },
    { provide: SUMMARY_PORT, useExisting: SummaryService },
  ],
  exports: [RoutingService, MessageProcessorService],
})
export class RoutingModule {}
