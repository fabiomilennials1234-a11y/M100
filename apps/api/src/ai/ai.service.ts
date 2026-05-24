import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AIDecision, AIAction, AIProvider, DomainEvent } from '@motor100/shared';
import { PrismaService } from '../prisma/prisma.service';
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {
    this.apiKey = process.env.OPENROUTER_API_KEY ?? '';
    this.model = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-sonnet-4-20250514';
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
    const dbMessages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const messages = dbMessages.map((m: any) => ({
      role: m.sender === 'customer' ? 'user' : 'assistant',
      content: m.content,
    }));

    return this.generateResponse(conversationId, messages);
  }

  @OnEvent(DomainEvent.MESSAGE_RECEIVED)
  async handleMessage(payload: { conversation: any; message: any }) {
    if (payload.conversation.ownerType !== 'ai') return;

    const decision = await this.processMessage(payload.conversation.id);
    this.events.emit(DomainEvent.AI_RESPONSE_GENERATED, {
      conversation: payload.conversation,
      decision,
    });
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
