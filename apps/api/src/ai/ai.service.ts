import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import {
  AIDecision,
  AIAction,
  AIProvider,
  GUARDRAIL_PORT,
  GuardrailPort,
} from '@motor100/shared';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryService } from '../memory/memory.service';
import { ErpToolRegistry, ToolContext } from '../integration/erp-tool-registry';
import axios from 'axios';

/** Max tool rounds per message — bounds token cost and prevents infinite loops. */
const MAX_TOOL_ROUNDS = 3;
const DEFAULT_FILIAL = 1;

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
    @Inject(GUARDRAIL_PORT) @Optional() private readonly guardrail?: GuardrailPort,
    @Optional() private readonly tools?: ErpToolRegistry,
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
      const message = await this.postChat([
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ]);
      return this.parseDecision(message?.content ?? '');
    } catch (error) {
      this.logger.error(`OpenRouter API error for ${conversationId}: ${error}`);
      return {
        action: AIAction.HANDOFF,
        reason: 'AI error — forwarding to human agent',
      };
    }
  }

  /**
   * Tool-calling loop: offers the ERP tools to the model, dispatches the calls
   * it requests (each filtered by the guardrail allowlist, fail-closed) against
   * the ERP, re-injects the results, and repeats until a final answer or the
   * round cap. The model's final message is the JSON decision (parseDecision).
   */
  private async generateWithTools(
    conversationId: string,
    contextMessages: Array<{ role: string; content: string }>,
    ctx: ToolContext,
  ): Promise<AIDecision> {
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...contextMessages,
    ];
    const toolDefs = this.tools!.definitions();

    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const message = await this.postChat(messages, toolDefs);
        const toolCalls = message?.tool_calls ?? [];

        if (toolCalls.length === 0) {
          return this.parseDecision(message?.content ?? '');
        }

        messages.push(message);
        for (const call of toolCalls) {
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: await this.runToolCall(call, ctx),
          });
        }
      }

      this.logger.warn(`Tool loop hit round cap for ${conversationId}`);
      return {
        action: AIAction.HANDOFF,
        reason: 'tool loop limit reached — forwarding to human agent',
      };
    } catch (error) {
      this.logger.error(`Tool loop error for ${conversationId}: ${error}`);
      return {
        action: AIAction.HANDOFF,
        reason: 'AI error — forwarding to human agent',
      };
    }
  }

  /** Runs one tool call through the guardrail allowlist then the ERP registry. */
  private async runToolCall(call: any, ctx: ToolContext): Promise<string> {
    const name = call.function?.name ?? '';
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(call.function?.arguments ?? '{}');
    } catch {
      args = {};
    }

    const intercept = this.guardrail!.interceptToolCall(name, args);
    if (!intercept.allowed) {
      this.logger.warn(`Tool blocked by guardrail: ${name} (${intercept.reason})`);
      return JSON.stringify({ error: intercept.reason ?? 'tool_blocked' });
    }

    try {
      const result = await this.tools!.dispatch(name, args, ctx);
      return JSON.stringify(result);
    } catch (error) {
      this.logger.error(`Tool ${name} failed: ${error}`);
      return JSON.stringify({ error: 'tool_failed' });
    }
  }

  private async postChat(messages: any[], tools?: unknown[]): Promise<any> {
    const body: Record<string, unknown> = { model: this.model, messages };
    if (tools && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );
    return response.data.choices?.[0]?.message;
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

    if (this.tools && this.guardrail && conversation) {
      const ctx = await this.resolveToolContext(conversation);
      return this.generateWithTools(conversationId, contextMessages, ctx);
    }

    return this.generateResponse(conversationId, contextMessages);
  }

  /** Resolves the per-conversation tool context (cdFilial from the Channel Instance). */
  private async resolveToolContext(conversation: {
    instanceId?: string;
  }): Promise<ToolContext> {
    let cdFilial = DEFAULT_FILIAL;
    if (conversation.instanceId) {
      const instance = await this.prisma.channelInstance.findUnique({
        where: { id: conversation.instanceId },
      });
      if (instance?.cdFilial) cdFilial = instance.cdFilial;
    }
    return { cdFilial };
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
