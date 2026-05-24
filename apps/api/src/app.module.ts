import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma';
import { TracingModule } from './tracing';
import { ConversationModule } from './conversation';
import { RoutingModule } from './routing';
import { AiModule } from './ai';
import { ChannelModule } from './channel';
import { IntegrationModule } from './integration';
import { AgentModule } from './agent';
import { GuardrailModule } from './guardrail';
import { MediaModule } from './media';
import { MemoryModule } from './memory';
import { SummaryModule } from './summary';
import { ApiModule } from './api';

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
    ApiModule,
  ],
})
export class AppModule {}
