import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryService } from '../memory/memory.service';
import { SummaryPort } from '@motor100/shared';
import axios from 'axios';

@Injectable()
export class SummaryService implements SummaryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memory: MemoryService,
  ) {}

  async generateProgressiveSummary(conversationId: string): Promise<string> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new Error(`Conversation ${conversationId} not found`);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip: conversation.summaryMessageCount ?? 0,
    });

    const previousSummary = conversation.progressiveSummary;
    const prompt = this.buildProgressivePrompt(previousSummary, messages);

    const summary = await this.callLLM(prompt);

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        progressiveSummary: summary,
        summaryMessageCount: (conversation.summaryMessageCount ?? 0) + messages.length,
      },
    });

    return summary;
  }

  async generateFinalSummary(conversationId: string): Promise<string> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new Error(`Conversation ${conversationId} not found`);

    const recentMessages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const prompt = this.buildFinalPrompt(
      conversation.progressiveSummary,
      recentMessages.reverse(),
    );

    const rawResponse = await this.callLLM(prompt);
    let parsed: { summary: string; sentiment: string; tags: string[] };

    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      parsed = { summary: rawResponse, sentiment: 'unknown', tags: [] };
    }

    const finalText = `${parsed.summary} | Sentimento: ${parsed.sentiment} | Tags: ${parsed.tags.join(', ')}`;

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { finalSummary: finalText },
    });

    await this.memory.storeMemory(conversation.externalPhone, finalText);

    return finalText;
  }

  private buildProgressivePrompt(
    previousSummary: string | null,
    messages: Array<{ direction: string; sender: string; content: string }>,
  ): string {
    const msgText = messages
      .map(m => `[${m.sender}] ${m.content}`)
      .join('\n');

    if (previousSummary) {
      return `Resumo anterior:\n${previousSummary}\n\nNovas mensagens:\n${msgText}\n\nGere um resumo atualizado e conciso da conversa inteira.`;
    }

    return `Mensagens:\n${msgText}\n\nGere um resumo conciso desta conversa.`;
  }

  private buildFinalPrompt(
    progressiveSummary: string | null,
    recentMessages: Array<{ direction: string; sender: string; content: string }>,
  ): string {
    const msgText = recentMessages
      .map(m => `[${m.sender}] ${m.content}`)
      .join('\n');

    const context = progressiveSummary
      ? `Resumo progressivo:\n${progressiveSummary}\n\n`
      : '';

    return `${context}Últimas mensagens:\n${msgText}\n\nGere um JSON com: {"summary": "resumo final", "sentiment": "positivo|negativo|neutro", "tags": ["tag1", "tag2"]}`;
  }

  private async callLLM(prompt: string): Promise<string> {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.OPENROUTER_MODEL ?? 'anthropic/claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: 'Você é um assistente que gera resumos concisos de conversas de atendimento.' },
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data.choices[0].message.content;
  }
}
