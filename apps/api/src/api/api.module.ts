import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { ConversationModule } from '../conversation/conversation.module';
import { ChannelModule } from '../channel/channel.module';
import { AgentModule } from '../agent/agent.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConversationModule, ChannelModule, AgentModule],
  controllers: [ApiController],
  providers: [SupabaseAuthGuard],
})
export class ApiModule {}
