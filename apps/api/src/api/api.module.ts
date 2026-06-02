import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { InstanceController } from './instance.controller';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { AdminGuard } from './admin.guard';
import { ConversationModule } from '../conversation';
import { ChannelModule } from '../channel';
import { AgentModule } from '../agent';
import { InstanceModule } from '../instance';
import { CONVERSATION_PORT, CHANNEL_PORT, AGENT_PORT } from '@motor100/shared';
import { ConversationService } from '../conversation/conversation.service';
import { ChannelService } from '../channel/channel.service';
import { AgentService } from '../agent/agent.service';

@Module({
  imports: [ConversationModule, ChannelModule, AgentModule, InstanceModule],
  controllers: [ApiController, InstanceController],
  providers: [
    SupabaseAuthGuard,
    AdminGuard,
    { provide: CONVERSATION_PORT, useExisting: ConversationService },
    { provide: CHANNEL_PORT, useExisting: ChannelService },
    { provide: AGENT_PORT, useExisting: AgentService },
  ],
})
export class ApiModule {}
