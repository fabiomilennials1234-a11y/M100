import { MemoryService } from './memory.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MemoryService', () => {
  let service: MemoryService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
    };

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
        if (key === 'SUPABASE_ANON_KEY') return 'test-anon-key';
        return undefined;
      }),
    } as unknown as ConfigService;

    service = new MemoryService(mockPrisma as PrismaService, configService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('stores memory embedding via Supabase Edge Function + Prisma raw', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { embedding: new Array(384).fill(0.1) },
    });
    mockPrisma.$executeRaw.mockResolvedValueOnce(1);

    await service.storeMemory('+5511999990000', 'Cliente perguntou sobre prazo de entrega');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/embed',
      { text: 'Cliente perguntou sobre prazo de entrega' },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-anon-key',
        }),
      }),
    );
    expect(mockPrisma.$executeRaw).toHaveBeenCalled();
  });

  it('retrieves top-5 relevant chunks by cosine similarity', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { embedding: new Array(384).fill(0.2) },
    });

    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { id: '1', content: 'Prazo é 3-5 dias', similarity: 0.95, created_at: new Date() },
      { id: '2', content: 'Frete grátis acima 200', similarity: 0.88, created_at: new Date() },
    ]);

    const results = await service.retrieveRelevant('+5511999990000', 'qual o prazo?');

    expect(results).toHaveLength(2);
    expect(results[0].text).toBe('Prazo é 3-5 dias');
    expect(results[0].similarity).toBe(0.95);
  });

  it('returns empty array when no memories exist', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { embedding: new Array(384).fill(0.1) },
    });
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);

    const results = await service.retrieveRelevant('+5511999990000', 'qualquer coisa');

    expect(results).toEqual([]);
  });
});
