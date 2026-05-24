import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { AIDecision, AIAction, AIProvider } from '@motor100/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryService } from '../memory/memory.service';
import axios from 'axios';

const SYSTEM_PROMPT = `Você é um assistente de atendimento ao cliente. Responda de forma educada, objetiva e útil.

Retorne SEMPRE um JSON válido com esta estrutura:
{
  "action": "respond" | "handoff",
  "reason": "explicação breve da decisão",
  "message": "resposta ao cliente (apenas quando action=respond)"
}

Use "handoff" quando:
- O cliente precisa de suporte humano especializado
- Você não tem informação suficiente para responder
- O assunto envolve cobrança, cancelamento ou reclamações graves

Use "respond" para perguntas gerais, dúvidas simples, saudações.`;

@Injectable()
export class AiService implements AIProvider {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly contextWindowSize: number;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MemoryService) @Optional() private readonly memory?: MemoryService,
  ) {
    this.apiKey = process.env.OPENROUTER_API_KEY ?? '';
    this.model = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-sonnet-4-20250514';
    this.contextWindowSize = parseInt(process.env.AI_CONTEXT_MESSAGES ?? '5', 10);
  }

  async generateResponse(
    conversationId: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<AIDecision> {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );

      const raw = response.data.choices?.[0]?.message?.content ?? '';
      return this.parseDecision(raw);
    } catch (error) {
      this.logger.error(`OpenRouter API error for ${conversationId}: ${error}`);
      return {
        action: AIAction.HANDOFF,
        reason: 'AI error — forwarding to human agent',
      };
    }
  }

  async processMessage(conversationId: string): Promise<AIDecision> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    const dbMessages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: this.contextWindowSize,
    });

    const recentMessages = dbMessages.reverse().map((m: any) => ({
      role: m.sender === 'customer' ? 'user' : 'assistant',
      content: m.content,
    }));

    const contextMessages: Array<{ role: string; content: string }> = [];

    if (this.memory && conversation) {
      const lastUserMsg = recentMessages.filter(m => m.role === 'user').pop();
      if (lastUserMsg) {
        const memories = await this.memory.retrieveRelevant(
          conversation.externalPhone,
          lastUserMsg.content,
        );

        if (memories.length > 0) {
          const memoryText = memories.map(m => `- ${m.text}`).join('\n');
          contextMessages.push({
            role: 'system',
            content: `Memória semântica (interações anteriores relevantes):\n${memoryText}`,
          });
        }
      }
    }

    if (conversation?.progressiveSummary) {
      contextMessages.push({
        role: 'system',
        content: `Resumo da conversa atual:\n${conversation.progressiveSummary}`,
      });
    }

    contextMessages.push(...recentMessages);

    return this.generateResponse(conversationId, contextMessages);
  }

  private parseDecision(raw: string): AIDecision {
    try {
      const parsed = JSON.parse(raw);
      const action = parsed.action === 'respond' ? AIAction.RESPOND : AIAction.HANDOFF;
      return {
        action,
        reason: parsed.reason ?? 'no reason provided',
        message: action === AIAction.RESPOND ? parsed.message : undefined,
      };
    } catch {
      this.logger.warn(`Failed to parse AI response: ${raw.slice(0, 100)}`);
      return {
        action: AIAction.HANDOFF,
        reason: 'AI response parse error — forwarding to human agent',
      };
    }
  }
}
