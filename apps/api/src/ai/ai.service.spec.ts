import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryService } from '../memory/memory.service';
import { AIAction, DomainEvent } from '@motor100/shared';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AiService', () => {
  let service: AiService;
  let prisma: any;
  let events: EventEmitter2;
  let mockMemory: any;

  beforeEach(async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.OPENROUTER_MODEL = 'anthropic/claude-sonnet-4-20250514';

    prisma = {
      message: {
        findMany: jest.fn().mockResolvedValue([
          { direction: 'inbound', sender: 'customer', content: 'Oi, preciso de ajuda' },
          { direction: 'outbound', sender: 'ai', content: 'Olá! Como posso ajudar?' },
          { direction: 'inbound', sender: 'customer', content: 'Qual o prazo de entrega?' },
        ]),
      },
      conversation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'conv-123',
          externalPhone: '+5511999990000',
          progressiveSummary: null,
        }),
      },
    };

    mockMemory = {
      retrieveRelevant: jest.fn().mockResolvedValue([]),
      storeMemory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: MemoryService, useValue: mockMemory },
      ],
    }).compile();

    service = module.get(AiService);
    events = module.get(EventEmitter2);
  });

  afterEach(() => jest.clearAllMocks());

  it('parses respond action from OpenRouter response', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              action: 'respond',
              reason: 'customer asked about delivery',
              message: 'O prazo de entrega é de 3 a 5 dias úteis.',
            }),
          },
        }],
      },
    });

    const decision = await service.generateResponse('conv-123', []);

    expect(decision.action).toBe(AIAction.RESPOND);
    expect(decision.message).toBe('O prazo de entrega é de 3 a 5 dias úteis.');
    expect(decision.reason).toBe('customer asked about delivery');
  });

  it('parses handoff action from OpenRouter response', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              action: 'handoff',
              reason: 'customer needs human support for billing issue',
            }),
          },
        }],
      },
    });

    const decision = await service.generateResponse('conv-123', []);

    expect(decision.action).toBe(AIAction.HANDOFF);
    expect(decision.reason).toBe('customer needs human support for billing issue');
    expect(decision.message).toBeUndefined();
  });

  it('fetches last 5 messages for context (reduced from 20)', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        choices: [{
          message: { content: JSON.stringify({ action: 'respond', reason: 'ok', message: 'test' }) },
        }],
      },
    });

    await service.processMessage('conv-123');

    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: { conversationId: 'conv-123' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  });

  it('returns graceful fallback on API error', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('OpenRouter timeout'));

    const decision = await service.generateResponse('conv-123', []);

    expect(decision.action).toBe(AIAction.HANDOFF);
    expect(decision.reason).toContain('error');
  });

  it('handles malformed AI response gracefully', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        choices: [{ message: { content: 'not json at all' } }],
      },
    });

    const decision = await service.generateResponse('conv-123', []);

    expect(decision.action).toBe(AIAction.HANDOFF);
    expect(decision.reason).toContain('parse');
  });

  describe('context assembly with memory', () => {
    it('includes semantic memory in context when available', async () => {
      mockMemory.retrieveRelevant.mockResolvedValueOnce([
        { text: 'Cliente comprou produto X em janeiro', similarity: 0.92, createdAt: new Date() },
        { text: 'Preferência por entrega expressa', similarity: 0.85, createdAt: new Date() },
      ]);

      prisma.conversation.findUnique.mockResolvedValueOnce({
        id: 'conv-123',
        externalPhone: '+5511999990000',
        progressiveSummary: 'Cliente perguntou sobre prazo.',
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: { content: JSON.stringify({ action: 'respond', reason: 'ok', message: 'test' }) },
          }],
        },
      });

      await service.processMessage('conv-123');

      const callArgs = mockedAxios.post.mock.calls[0][1] as any;
      const messages = callArgs.messages;

      expect(messages[0].role).toBe('system');
      const memoryMsg = messages.find((m: any) => m.content?.includes('Memória semântica'));
      expect(memoryMsg).toBeDefined();
      expect(memoryMsg.content).toContain('Cliente comprou produto X');

      const summaryMsg = messages.find((m: any) => m.content?.includes('Resumo da conversa'));
      expect(summaryMsg).toBeDefined();
      expect(summaryMsg.content).toContain('Cliente perguntou sobre prazo');
    });

    it('omits memory and summary sections when not available', async () => {
      mockMemory.retrieveRelevant.mockResolvedValueOnce([]);

      prisma.conversation.findUnique.mockResolvedValueOnce({
        id: 'conv-123',
        externalPhone: '+5511999990000',
        progressiveSummary: null,
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: { content: JSON.stringify({ action: 'respond', reason: 'ok', message: 'test' }) },
          }],
        },
      });

      await service.processMessage('conv-123');

      const callArgs = mockedAxios.post.mock.calls[0][1] as any;
      const messages = callArgs.messages;

      const memoryMsg = messages.find((m: any) => m.content?.includes('Memória semântica'));
      expect(memoryMsg).toBeUndefined();

      const summaryMsg = messages.find((m: any) => m.content?.includes('Resumo da conversa'));
      expect(summaryMsg).toBeUndefined();
    });

    it('requests only last 5 messages from database', async () => {
      mockMemory.retrieveRelevant.mockResolvedValueOnce([]);
      prisma.conversation.findUnique.mockResolvedValueOnce({
        id: 'conv-123',
        externalPhone: '+5511999990000',
        progressiveSummary: null,
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: { content: JSON.stringify({ action: 'respond', reason: 'ok', message: 'test' }) },
          }],
        },
      });

      await service.processMessage('conv-123');

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });
  });

  it('calls OpenRouter with correct model and system prompt', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        choices: [{
          message: { content: JSON.stringify({ action: 'respond', reason: 'ok', message: 'hi' }) },
        }],
      },
    });

    await service.generateResponse('conv-123', [
      { role: 'user', content: 'Oi' },
    ]);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        model: 'anthropic/claude-sonnet-4-20250514',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: 'Oi' }),
        ]),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
  });
});
