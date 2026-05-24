import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { AIAction, DomainEvent } from '@motor100/shared';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AiService', () => {
  let service: AiService;
  let prisma: any;
  let events: EventEmitter2;

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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get(AiService);
    events = module.get(EventEmitter2);
  });

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

  it('fetches last 20 messages for context', async () => {
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
      orderBy: { createdAt: 'asc' },
      take: 20,
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
