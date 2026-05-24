import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { ConversationModule } from './conversation/conversation.module';
import { RoutingModule } from './routing/routing.module';
import { AiModule } from './ai/ai.module';
import { ChannelModule } from './channel/channel.module';
import { IntegrationModule } from './integration/integration.module';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    }),
    PrismaModule,
    ConversationModule,
    RoutingModule,
    AiModule,
    ChannelModule,
    IntegrationModule,
    AgentModule,
  ],
})
export class AppModule {}
