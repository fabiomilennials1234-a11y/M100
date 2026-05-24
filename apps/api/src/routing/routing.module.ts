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
import { ROUTING_PORT, AGENT_PORT } from '@motor100/shared';
import { AgentService } from '../agent/agent.service';

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
  ],
  exports: [RoutingService, MessageProcessorService],
})
export class RoutingModule {}
