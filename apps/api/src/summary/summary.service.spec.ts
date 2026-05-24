import { SummaryService } from './summary.service';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryService } from '../memory/memory.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SummaryService', () => {
  let service: SummaryService;
  let mockPrisma: any;
  let mockMemory: any;

  beforeEach(() => {
    mockPrisma = {
      conversation: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      message: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    mockMemory = {
      storeMemory: jest.fn(),
    };

    service = new SummaryService(
      mockPrisma as PrismaService,
      mockMemory as MemoryService,
    );

    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.OPENROUTER_MODEL = 'test-model';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('generateProgressiveSummary', () => {
    it('generates rolling summary from recent messages + previous summary', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValueOnce({
        id: 'conv-1',
        externalPhone: '+5511999990000',
        progressiveSummary: 'Cliente perguntou sobre prazo.',
        summaryMessageCount: 10,
      });

      mockPrisma.message.findMany.mockResolvedValueOnce([
        { direction: 'inbound', sender: 'customer', content: 'E o frete?' },
        { direction: 'outbound', sender: 'ai', content: 'Frete grátis acima de R$200.' },
      ]);

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: { content: 'Cliente perguntou sobre prazo e frete. Frete grátis acima de R$200.' },
          }],
        },
      });

      mockPrisma.conversation.update.mockResolvedValueOnce({});

      const result = await service.generateProgressiveSummary('conv-1');

      expect(result).toBe('Cliente perguntou sobre prazo e frete. Frete grátis acima de R$200.');
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: expect.objectContaining({
          progressiveSummary: expect.any(String),
        }),
      });
    });

    it('works without previous summary (first summary)', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValueOnce({
        id: 'conv-1',
        externalPhone: '+5511999990000',
        progressiveSummary: null,
        summaryMessageCount: 0,
      });

      mockPrisma.message.findMany.mockResolvedValueOnce([
        { direction: 'inbound', sender: 'customer', content: 'Oi' },
      ]);

      mockedAxios.post.mockResolvedValueOnce({
        data: { choices: [{ message: { content: 'Cliente iniciou conversa.' } }] },
      });

      mockPrisma.conversation.update.mockResolvedValueOnce({});

      const result = await service.generateProgressiveSummary('conv-1');

      expect(result).toBe('Cliente iniciou conversa.');
    });
  });

  describe('generateFinalSummary', () => {
    it('generates final summary with sentiment and tags, stores as memory', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValueOnce({
        id: 'conv-1',
        externalPhone: '+5511999990000',
        progressiveSummary: 'Resumo progressivo existente.',
      });

      mockPrisma.message.findMany.mockResolvedValueOnce([
        { direction: 'inbound', sender: 'customer', content: 'Obrigado, resolvido!' },
      ]);

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                summary: 'Cliente teve dúvida sobre prazo, resolvida com sucesso.',
                sentiment: 'positivo',
                tags: ['prazo', 'entrega', 'satisfeito'],
              }),
            },
          }],
        },
      });

      mockPrisma.conversation.update.mockResolvedValueOnce({});

      const result = await service.generateFinalSummary('conv-1');

      expect(result).toContain('Cliente teve dúvida sobre prazo');
      expect(mockMemory.storeMemory).toHaveBeenCalledWith(
        '+5511999990000',
        expect.stringContaining('Cliente teve dúvida sobre prazo'),
      );
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: expect.objectContaining({
          finalSummary: expect.any(String),
        }),
      });
    });

    it('handles missing progressive summary gracefully', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValueOnce({
        id: 'conv-1',
        externalPhone: '+5511999990000',
        progressiveSummary: null,
      });

      mockPrisma.message.findMany.mockResolvedValueOnce([
        { direction: 'inbound', sender: 'customer', content: 'Oi' },
      ]);

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: JSON.stringify({
                summary: 'Conversa curta sem resolução.',
                sentiment: 'neutro',
                tags: [],
              }),
            },
          }],
        },
      });

      mockPrisma.conversation.update.mockResolvedValueOnce({});

      const result = await service.generateFinalSummary('conv-1');

      expect(result).toContain('Conversa curta');
    });
  });
});
