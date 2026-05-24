import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { ConversationModule } from '../conversation';
import { ChannelModule } from '../channel';
import { AgentModule } from '../agent';

@Module({
  imports: [ConversationModule, ChannelModule, AgentModule],
  controllers: [ApiController],
  providers: [SupabaseAuthGuard],
})
export class ApiModule {}
