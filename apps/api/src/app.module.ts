import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { TracingModule } from './tracing/tracing.module';
import { ConversationModule } from './conversation/conversation.module';
import { RoutingModule } from './routing/routing.module';
import { AiModule } from './ai/ai.module';
import { ChannelModule } from './channel/channel.module';
import { IntegrationModule } from './integration/integration.module';
import { AgentModule } from './agent/agent.module';
import { GuardrailModule } from './guardrail/guardrail.module';
import { MediaModule } from './media/media.module';
import { MemoryModule } from './memory/memory.module';
import { SummaryModule } from './summary/summary.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    }),
    PrismaModule,
    TracingModule,
    ConversationModule,
    RoutingModule,
    AiModule,
    ChannelModule,
    IntegrationModule,
    AgentModule,
    GuardrailModule,
    MediaModule,
    MemoryModule,
    SummaryModule,
  ],
})
export class AppModule {}
