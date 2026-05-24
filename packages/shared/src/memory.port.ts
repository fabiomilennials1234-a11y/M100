export interface MemoryChunk {
  text: string;
  similarity: number;
  createdAt: Date;
}

export interface MemoryPort {
  storeMemory(phone: string, text: string): Promise<void>;
  retrieveRelevant(phone: string, query: string, limit?: number): Promise<MemoryChunk[]>;
}
