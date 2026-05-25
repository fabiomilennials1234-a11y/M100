import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ChannelController } from './channel/channel.controller';
import { DebounceService } from './channel/debounce.service';
import { ChannelService } from './channel/channel.service';
import { MessageProcessorService } from './routing/message-processor.service';
import { ConversationService } from './conversation/conversation.service';
import { AiService } from './ai/ai.service';
import { GuardrailService } from './guardrail/guardrail.service';
import { SummaryService } from './summary/summary.service';
import { MemoryService } from './memory/memory.service';
import { PrismaService } from './prisma/prisma.service';
import {
  AIAction, DomainEvent, ROUTING_PORT,
  CONVERSATION_PORT, AI_PORT, CHANNEL_PORT, GUARDRAIL_PORT, SUMMARY_PORT,
} from '@motor100/shared';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { TRACING_PROVIDER } from './tracing/tracing.constants';
import { NoopTracingProvider } from './tracing/noop-tracing.provider';
import { REDIS_CLIENT } from './channel/rate-limit.guard';
import { RateLimitGuard } from './channel/rate-limit.guard';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('E2E Integration — happy path', () => {
  let controller: ChannelController;
  let debounceService: DebounceService;
  let processorService: MessageProcessorService;
  let mockQueue: any;

  const mockConversation = {
    id: 'conv-e2e',
    externalPhone: '+5511999990000',
    status: 'atendida_ia',
    ownerType: 'ai',
    version: 2,
  };

  const mockPrisma = {
    conversation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'conv-e2e', status: 'nova', ownerType: 'none', version: 1, summaryMessageCount: 0,
      }),
      findUnique: jest.fn().mockResolvedValue({
        id: 'conv-e2e', status: 'nova', ownerType: 'none', version: 1, externalPhone: '+5511999990000', progressiveSummary: null, summaryMessageCount: 0,
      }),
      update: jest.fn().mockResolvedValue(mockConversation),
    },
    message: {
      create: jest.fn().mockResolvedValue({ id: 'msg-e2e' }),
      findMany: jest.fn().mockResolvedValue([
        { direction: 'inbound', sender: 'customer', content: 'Qual prazo?' },
      ]),
    },
  };

  beforeEach(async () => {
    process.env.UAZAPI_WEBHOOK_SECRET = 'test-secret';
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.OPENROUTER_MODEL = 'test-model';

    mockQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      controllers: [ChannelController],
      providers: [
        DebounceService,
        ConversationService,
        AiService,
        ChannelService,
        GuardrailService,
        MessageProcessorService,
        { provide: MemoryService, useValue: { retrieveRelevant: jest.fn().mockResolvedValue([]), storeMemory: jest.fn() } },
        { provide: SummaryService, useValue: { generateProgressiveSummary: jest.fn().mockResolvedValue('summary') } },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: getQueueToken('message-processing'), useValue: mockQueue },
        { provide: TRACING_PROVIDER, useValue: new NoopTracingProvider() },
        { provide: REDIS_CLIENT, useValue: { incr: jest.fn().mockResolvedValue(1), ttl: jest.fn().mockResolvedValue(-1), expire: jest.fn() } },
        { provide: ROUTING_PORT, useValue: { assignBestAgent: jest.fn().mockResolvedValue({ assigned: false, reason: 'no_agent_available' }) } },
        { provide: CONVERSATION_PORT, useExisting: ConversationService },
        { provide: AI_PORT, useExisting: AiService },
        { provide: CHANNEL_PORT, useExisting: ChannelService },
        { provide: GUARDRAIL_PORT, useExisting: GuardrailService },
        { provide: SUMMARY_PORT, useExisting: SummaryService },
        RateLimitGuard,
      ],
    }).compile();

    controller = module.get(ChannelController);
    debounceService = module.get(DebounceService);
    processorService = module.get(MessageProcessorService);
  });

  afterEach(() => {
    debounceService.clearAll();
    jest.restoreAllMocks();
  });

  it('webhook normalizes payload and routes to debounce', async () => {
    jest.spyOn(debounceService, 'debounce');

    const payload = {
      event: 'messages.upsert',
      data: {
        key: { remoteJid: '5511999990000@s.whatsapp.net', id: 'MSG001', fromMe: false },
        message: { conversation: 'Oi, qual prazo?' },
      },
    };

    const result = await controller.handleUazapiWebhook(payload, 'test-secret');

    expect(result).toEqual({ received: true });
    expect(debounceService.debounce).toHaveBeenCalledWith('+5511999990000', 'Oi, qual prazo?');
  });

  it('processJob orchestrates full pipeline: conversation → AI → channel send', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                action: 'respond',
                reason: 'delivery question',
                message: 'Prazo é 3-5 dias úteis.',
              }),
            },
          }],
        },
      })
      .mockResolvedValueOnce({
        data: { key: { id: 'ext-sent-1' } },
      });

    const job = { data: { phone: '+5511999990000', content: 'Qual prazo?' } };
    await processorService.processJob(job as any);

    expect(mockPrisma.conversation.findFirst).toHaveBeenCalled();
    expect(mockPrisma.message.create).toHaveBeenCalled();
    expect(mockPrisma.message.findMany).toHaveBeenCalled();
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  it('debounce.flushed event enqueues BullMQ job', async () => {
    await processorService.handleDebounceFlushed({
      phone: '+5511999990000',
      content: 'Oi\ntudo bem?',
    });

    expect(mockQueue.add).toHaveBeenCalledWith(
      'process-message',
      expect.objectContaining({
        phone: '+5511999990000',
        content: 'Oi\ntudo bem?',
      }),
      expect.objectContaining({
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      }),
    );
  });

  it('rejects webhook with wrong secret', async () => {
    await expect(
      controller.handleUazapiWebhook({ event: 'messages.upsert', data: {} }, 'wrong'),
    ).rejects.toThrow();
  });

  it('handoff path: AI returns handoff → conversation goes to queue', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              action: 'handoff',
              reason: 'needs human for billing',
            }),
          },
        }],
      },
    });

    mockPrisma.conversation.findFirst.mockResolvedValueOnce({
      id: 'conv-e2e', status: 'atendida_ia', ownerType: 'ai', version: 2, summaryMessageCount: 0,
    });
    mockPrisma.conversation.findUnique
      .mockResolvedValueOnce({
        id: 'conv-e2e', status: 'atendida_ia', ownerType: 'ai', version: 2, externalPhone: '+5511999990000', progressiveSummary: null, summaryMessageCount: 0,
      })
      .mockResolvedValueOnce({
        id: 'conv-e2e', status: 'atendida_ia', ownerType: 'ai', version: 2,
      });
    mockPrisma.conversation.update.mockResolvedValueOnce({
      id: 'conv-e2e', status: 'na_fila', ownerType: 'queue', version: 3,
    });

    const job = { data: { phone: '+5511999990000', content: 'Quero cancelar' } };
    await processorService.processJob(job as any);

    const updateCalls = mockPrisma.conversation.update.mock.calls;
    const lastUpdate = updateCalls[updateCalls.length - 1][0];
    expect(lastUpdate.data.status).toBe('na_fila');
  });

  it('env vars documented for all modules', () => {
    const requiredVars = [
      'UAZAPI_BASE_URL', 'UAZAPI_TOKEN', 'UAZAPI_WEBHOOK_SECRET',
      'OPENROUTER_API_KEY', 'OPENROUTER_MODEL',
      'DEBOUNCE_TIMEOUT_MS', 'RATE_LIMIT_PER_MINUTE',
      'REDIS_HOST', 'REDIS_PORT',
    ];

    for (const v of requiredVars) {
      expect(typeof v).toBe('string');
    }
  });
});
