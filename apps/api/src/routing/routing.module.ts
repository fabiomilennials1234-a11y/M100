import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RoutingService } from './routing.service';
import { MessageProcessorService } from './message-processor.service';
import { MessageWorker } from './message.processor';
import { DeadLetterProcessor } from './dead-letter.processor';
import { ConversationModule } from '../conversation/conversation.module';
import { AiModule } from '../ai/ai.module';
import { ChannelModule } from '../channel/channel.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'routing' }),
    BullModule.registerQueue({ name: 'message-processing' }),
    BullModule.registerQueue({ name: 'message-processing-failed' }),
    ConversationModule,
    AiModule,
    ChannelModule,
  ],
  providers: [
    RoutingService,
    MessageProcessorService,
    MessageWorker,
    DeadLetterProcessor,
  ],
  exports: [RoutingService, MessageProcessorService],
})
export class RoutingModule {}
