import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryService } from '../memory/memory.service';
import { ErpToolRegistry } from '../integration/erp-tool-registry';
import { AIAction, GUARDRAIL_PORT } from '@motor100/shared';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const PRODUCT_TOOL_DEF = {
  type: 'function' as const,
  function: {
    name: 'get_product_info',
    description: 'busca produto',
    parameters: { type: 'object' as const, properties: {}, required: ['query'] },
  },
};

function toolCallMessage(args: object) {
  return {
    data: {
      choices: [
        {
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call_1',
                type: 'function',
                function: { name: 'get_product_info', arguments: JSON.stringify(args) },
              },
            ],
          },
        },
      ],
    },
  };
}

function respondMessage(message: string) {
  return {
    data: {
      choices: [
        {
          message: {
            role: 'assistant',
            content: JSON.stringify({ action: 'respond', reason: 'achei', message }),
          },
        },
      ],
    },
  };
}

async function buildService(overrides?: {
  guardrail?: any;
  registry?: any;
}) {
  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.OPENROUTER_MODEL = 'test-model';

  const prisma = {
    conversation: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'conv-1',
        externalPhone: '+5511999990000',
        instanceId: 'inst-1',
        progressiveSummary: null,
      }),
    },
    message: {
      findMany: jest.fn().mockResolvedValue([
        { direction: 'inbound', sender: 'customer', content: 'tem junta da tampa?' },
      ]),
    },
    channelInstance: {
      findUnique: jest.fn().mockResolvedValue({ id: 'inst-1', cdFilial: 7 }),
    },
  };

  const guardrail = overrides?.guardrail ?? {
    interceptToolCall: jest.fn().mockReturnValue({ allowed: true }),
  };
  const registry = overrides?.registry ?? {
    definitions: jest.fn().mockReturnValue([PRODUCT_TOOL_DEF]),
    dispatch: jest.fn().mockResolvedValue({
      products: [{ idItem: 1, codigo: 'A', nome: 'Junta', marca: 'M', temEstoque: true, unidadeVenda: 'PC' }],
    }),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AiService,
      { provide: PrismaService, useValue: prisma },
      { provide: MemoryService, useValue: { retrieveRelevant: jest.fn().mockResolvedValue([]) } },
      { provide: GUARDRAIL_PORT, useValue: guardrail },
      { provide: ErpToolRegistry, useValue: registry },
    ],
  }).compile();

  return { service: module.get(AiService), prisma, guardrail, registry };
}

describe('AiService — ERP tool-calling loop', () => {
  afterEach(() => jest.clearAllMocks());

  it('lets the model query the ERP via a tool, then answers using the result', async () => {
    const { service, registry } = await buildService();
    mockedAxios.post
      .mockResolvedValueOnce(toolCallMessage({ query: 'junta tampa' }))
      .mockResolvedValueOnce(respondMessage('Temos sim, a Junta está disponível.'));

    const decision = await service.processMessage('conv-1');

    // tool dispatched with the query + the conversation's Filial (7)
    expect(registry.dispatch).toHaveBeenCalledWith(
      'get_product_info',
      { query: 'junta tampa' },
      { cdFilial: 7 },
    );
    // final answer after the tool round
    expect(decision.action).toBe(AIAction.RESPOND);
    expect(decision.message).toBe('Temos sim, a Junta está disponível.');
    // two OpenRouter calls: tool round + final
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    // tools were offered to the model
    expect(mockedAxios.post.mock.calls[0][1]).toHaveProperty('tools');
  });

  it('does not dispatch a tool the guardrail blocks (fail-closed)', async () => {
    const guardrail = {
      interceptToolCall: jest.fn().mockReturnValue({ allowed: false, reason: 'tool_blocked' }),
    };
    const { service, registry } = await buildService({ guardrail });
    mockedAxios.post
      .mockResolvedValueOnce(toolCallMessage({ query: 'x' }))
      .mockResolvedValueOnce(respondMessage('Não consegui consultar isso.'));

    const decision = await service.processMessage('conv-1');

    expect(registry.dispatch).not.toHaveBeenCalled();
    expect(decision.action).toBe(AIAction.RESPOND);
  });

  it('stops and hands off when the model keeps calling tools past the round cap', async () => {
    const { service } = await buildService();
    // Always returns a tool call → never converges
    mockedAxios.post.mockResolvedValue(toolCallMessage({ query: 'loop' }));

    const decision = await service.processMessage('conv-1');

    expect(decision.action).toBe(AIAction.HANDOFF);
    // capped at MAX_TOOL_ROUNDS (3) OpenRouter calls — no infinite loop
    expect(mockedAxios.post).toHaveBeenCalledTimes(3);
  });

  it('answers directly without dispatching when the model needs no tool', async () => {
    const { service, registry } = await buildService();
    mockedAxios.post.mockResolvedValueOnce(respondMessage('Olá! Como posso ajudar?'));

    const decision = await service.processMessage('conv-1');

    expect(registry.dispatch).not.toHaveBeenCalled();
    expect(decision.action).toBe(AIAction.RESPOND);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });
});
