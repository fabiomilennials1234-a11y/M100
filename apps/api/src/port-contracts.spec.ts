import { ConversationService } from './conversation/conversation.service';
import { AgentService } from './agent/agent.service';
import { MemoryService } from './memory/memory.service';
import { SummaryService } from './summary/summary.service';
import { RoutingService } from './routing/routing.service';
import { GuardrailService } from './guardrail/guardrail.service';
import { AiService } from './ai/ai.service';
import { ChannelService } from './channel/channel.service';
import { IntegrationService } from './integration/integration.service';
import type {
  MemoryPort,
  SummaryPort,
  RoutingPort,
  GuardrailPort,
  AIProvider,
  ChannelSender,
  IntegrationProvider,
} from '@motor100/shared';

type AssertImplements<T, U extends T> = U;

describe('Port contracts — compile-time + runtime', () => {
  describe('ConversationPort', () => {
    // Prisma Conversation type uses Prisma-generated enums (nominal mismatch with shared enums).
    // Runtime check verifies all port methods exist; compile-time enforced when Prisma enum alignment lands.
    const methods = [
      'findOrCreate', 'transition', 'handleInboundMessage', 'handleOutboundMessage',
      'requestHandoff', 'assignAgent', 'returnToAi', 'close',
      'findById', 'findMany', 'getMessages', 'getMetrics',
    ] as const;

    it.each(methods)('%s exists on ConversationService prototype', (method) => {
      expect(typeof ConversationService.prototype[method]).toBe('function');
    });
  });

  describe('AgentPort', () => {
    // Same Prisma enum mismatch as ConversationService — runtime-only for now.
    const methods = [
      'findAvailable', 'setAvailability', 'getActiveConversationCount', 'findById',
    ] as const;

    it.each(methods)('%s exists on AgentService prototype', (method) => {
      expect(typeof AgentService.prototype[method]).toBe('function');
    });
  });

  describe('MemoryPort', () => {
    type _check = AssertImplements<MemoryPort, MemoryService>;

    const methods: (keyof MemoryPort)[] = ['storeMemory', 'retrieveRelevant'];

    it.each(methods)('%s exists on MemoryService prototype', (method) => {
      expect(typeof MemoryService.prototype[method]).toBe('function');
    });
  });

  describe('SummaryPort', () => {
    type _check = AssertImplements<SummaryPort, SummaryService>;

    const methods: (keyof SummaryPort)[] = ['generateProgressiveSummary', 'generateFinalSummary'];

    it.each(methods)('%s exists on SummaryService prototype', (method) => {
      expect(typeof SummaryService.prototype[method]).toBe('function');
    });
  });

  describe('RoutingPort', () => {
    type _check = AssertImplements<RoutingPort, RoutingService>;

    const methods: (keyof RoutingPort)[] = ['assignBestAgent'];

    it.each(methods)('%s exists on RoutingService prototype', (method) => {
      expect(typeof RoutingService.prototype[method]).toBe('function');
    });
  });

  describe('GuardrailPort', () => {
    type _check = AssertImplements<GuardrailPort, GuardrailService>;

    const methods: (keyof GuardrailPort)[] = [
      'sanitizeInput', 'validateOutput', 'interceptToolCall', 'requestHumanApproval',
    ];

    it.each(methods)('%s exists on GuardrailService prototype', (method) => {
      expect(typeof GuardrailService.prototype[method]).toBe('function');
    });
  });

  describe('AIProvider', () => {
    type _check = AssertImplements<AIProvider, AiService>;

    const methods: (keyof AIProvider)[] = ['generateResponse', 'processMessage'];

    it.each(methods)('%s exists on AiService prototype', (method) => {
      expect(typeof AiService.prototype[method]).toBe('function');
    });
  });

  describe('ChannelSender', () => {
    type _check = AssertImplements<ChannelSender, ChannelService>;

    const methods: (keyof ChannelSender)[] = ['send'];

    it.each(methods)('%s exists on ChannelService prototype', (method) => {
      expect(typeof ChannelService.prototype[method]).toBe('function');
    });
  });

  describe('IntegrationProvider', () => {
    type _check = AssertImplements<IntegrationProvider, IntegrationService>;

    const methods: (keyof IntegrationProvider)[] = ['syncContact', 'syncConversation'];

    it.each(methods)('%s exists on IntegrationService prototype', (method) => {
      expect(typeof IntegrationService.prototype[method]).toBe('function');
    });
  });
});
