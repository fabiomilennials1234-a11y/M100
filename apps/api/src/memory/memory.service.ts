import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

export interface MemoryChunk {
  text: string;
  similarity: number;
  createdAt: Date;
}

@Injectable()
export class MemoryService {
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.supabaseUrl = this.config.get<string>('SUPABASE_URL') ?? '';
    this.supabaseKey = this.config.get<string>('SUPABASE_ANON_KEY') ?? '';
  }

  async storeMemory(phone: string, text: string): Promise<void> {
    const embedding = await this.generateEmbedding(text);
    const vectorStr = `[${embedding.join(',')}]`;

    await this.prisma.$executeRaw`
      INSERT INTO memory_embeddings (id, phone, content, embedding, created_at)
      VALUES (gen_random_uuid(), ${phone}, ${text}, ${vectorStr}::vector, now())
    `;
  }

  async retrieveRelevant(phone: string, query: string, limit = 5): Promise<MemoryChunk[]> {
    const embedding = await this.generateEmbedding(query);
    const vectorStr = `[${embedding.join(',')}]`;

    const results: Array<{ content: string; similarity: number; created_at: Date }> =
      await this.prisma.$queryRaw`
        SELECT content, 1 - (embedding <=> ${vectorStr}::vector) AS similarity, created_at
        FROM memory_embeddings
        WHERE phone = ${phone}
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT ${limit}
      `;

    return results.map(r => ({
      text: r.content,
      similarity: r.similarity,
      createdAt: r.created_at,
    }));
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await axios.post(
      `${this.supabaseUrl}/functions/v1/embed`,
      { text },
      {
        headers: {
          Authorization: `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data.embedding;
  }
}
