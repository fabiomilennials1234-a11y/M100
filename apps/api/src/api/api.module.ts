import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { ConversationModule } from '../conversation';
import { ChannelModule } from '../channel';
import { AgentModule } from '../agent';
import { CONVERSATION_PORT, CHANNEL_PORT, AGENT_PORT } from '@motor100/shared';
import { ConversationService } from '../conversation/conversation.service';
import { ChannelService } from '../channel/channel.service';
import { AgentService } from '../agent/agent.service';

@Module({
  imports: [ConversationModule, ChannelModule, AgentModule],
  controllers: [ApiController],
  providers: [
    SupabaseAuthGuard,
    { provide: CONVERSATION_PORT, useExisting: ConversationService },
    { provide: CHANNEL_PORT, useExisting: ChannelService },
    { provide: AGENT_PORT, useExisting: AgentService },
  ],
})
export class ApiModule {}
