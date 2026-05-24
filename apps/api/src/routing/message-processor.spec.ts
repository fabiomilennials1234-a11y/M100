import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageProcessorService } from './message-processor.service';
import { ConversationService } from '../conversation/conversation.service';
import { AiService } from '../ai/ai.service';
import { ChannelService } from '../channel/channel.service';
import { GuardrailService } from '../guardrail/guardrail.service';
import { SummaryService } from '../summary/summary.service';
import { AIAction, DomainEvent } from '@motor100/shared';
import { getQueueToken } from '@nestjs/bullmq';
import { TRACING_PROVIDER } from '../tracing/tracing.constants';
import { NoopTracingProvider } from '../tracing/noop-tracing.provider';

describe('MessageProcessorService', () => {
  let service: MessageProcessorService;
  let conversationService: any;
  let aiService: any;
  let channelService: any;
  let guardrailService: any;
  let summaryService: any;
  let events: any;
  let mockQueue: any;

  beforeEach(async () => {
    conversationService = {
      handleInboundMessage: jest.fn().mockResolvedValue({
        conversation: { id: 'conv-1', ownerType: 'ai', status: 'atendida_ia', summaryMessageCount: 5 },
        message: { id: 'msg-1' },
      }),
      requestHandoff: jest.fn(),
    };

    aiService = {
      processMessage: jest.fn().mockResolvedValue({
        action: AIAction.RESPOND,
        reason: 'answering question',
        message: 'Prazo é 3-5 dias.',
      }),
    };

    channelService = {
      send: jest.fn().mockResolvedValue({ externalId: 'ext-1' }),
    };

    guardrailService = {
      sanitizeInput: jest.fn().mockReturnValue({
        sanitized: 'clean text',
        piiRedacted: false,
        injectionFlagged: false,
        flags: [],
      }),
      validateOutput: jest.fn().mockReturnValue({
        valid: true,
        action: 'pass',
      }),
    };

    summaryService = {
      generateProgressiveSummary: jest.fn().mockResolvedValue('summary'),
    };

    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageProcessorService,
        { provide: ConversationService, useValue: conversationService },
        { provide: AiService, useValue: aiService },
        { provide: ChannelService, useValue: channelService },
        { provide: GuardrailService, useValue: guardrailService },
        { provide: SummaryService, useValue: summaryService },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: getQueueToken('message-processing'), useValue: mockQueue },
        { provide: TRACING_PROVIDER, useValue: new NoopTracingProvider() },
      ],
    }).compile();

    service = module.get(MessageProcessorService);
    events = module.get(EventEmitter2);
  });

  afterEach(() => jest.clearAllMocks());

  it('enqueues job on debounce.flushed event', async () => {
    await service.handleDebounceFlushed({ phone: '+5511999990000', content: 'Oi' });

    expect(mockQueue.add).toHaveBeenCalledWith(
      'process-message',
      { phone: '+5511999990000', content: 'Oi', timestamp: expect.any(Number) },
      expect.objectContaining({
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      }),
    );
  });

  it('processes job: conversation → AI → channel send on respond', async () => {
    const job = {
      data: { phone: '+5511999990000', content: 'Qual prazo?' },
    };

    await service.processJob(job as any);

    expect(conversationService.handleInboundMessage).toHaveBeenCalledWith(
      '+5511999990000', 'clean text', 'text',
    );
    expect(aiService.processMessage).toHaveBeenCalledWith('conv-1');
    expect(channelService.send).toHaveBeenCalledWith({
      to: '+5511999990000',
      content: 'Prazo é 3-5 dias.',
      type: 'text',
    });
  });

  it('calls requestHandoff when AI returns handoff', async () => {
    aiService.processMessage.mockResolvedValue({
      action: AIAction.HANDOFF,
      reason: 'complex billing issue',
    });

    const job = { data: { phone: '+5511999990000', content: 'Reclamação' } };
    await service.processJob(job as any);

    expect(conversationService.requestHandoff).toHaveBeenCalledWith('conv-1');
    expect(channelService.send).not.toHaveBeenCalled();
  });

  it('throws on processing error to trigger retry', async () => {
    conversationService.handleInboundMessage.mockRejectedValue(new Error('DB down'));

    const job = { data: { phone: '+5511999990000', content: 'test' } };
    await expect(service.processJob(job as any)).rejects.toThrow('DB down');
  });

  it('configures dead letter queue', () => {
    expect(MessageProcessorService.QUEUE_CONFIG).toEqual(
      expect.objectContaining({
        name: 'message-processing',
      }),
    );
  });

  describe('pipeline integration (Fase 3)', () => {
    it('runs input guardrail before AI call', async () => {
      const job = { data: { phone: '+5511999990000', content: 'Meu CPF é 123.456.789-00' } };
      await service.processJob(job as any);

      expect(guardrailService.sanitizeInput).toHaveBeenCalledWith('Meu CPF é 123.456.789-00');
      const sanitizeOrder = guardrailService.sanitizeInput.mock.invocationCallOrder[0];
      const aiOrder = aiService.processMessage.mock.invocationCallOrder[0];
      expect(sanitizeOrder).toBeLessThan(aiOrder);
    });

    it('runs output guardrail after AI response', async () => {
      const job = { data: { phone: '+5511999990000', content: 'Oi' } };
      await service.processJob(job as any);

      expect(guardrailService.validateOutput).toHaveBeenCalledWith('Prazo é 3-5 dias.');
      const aiOrder = aiService.processMessage.mock.invocationCallOrder[0];
      const validateOrder = guardrailService.validateOutput.mock.invocationCallOrder[0];
      expect(aiOrder).toBeLessThan(validateOrder);
    });

    it('triggers auto-handoff when output guardrail fails', async () => {
      guardrailService.validateOutput.mockReturnValue({
        valid: false,
        action: 'handoff',
        reason: 'pii_leakage_detected',
      });

      const job = { data: { phone: '+5511999990000', content: 'Oi' } };
      await service.processJob(job as any);

      expect(conversationService.requestHandoff).toHaveBeenCalledWith('conv-1');
      expect(channelService.send).not.toHaveBeenCalled();
    });

    it('passes sanitized content to conversation service', async () => {
      guardrailService.sanitizeInput.mockReturnValue({
        sanitized: 'Meu CPF é [CPF_REDACTED]',
        piiRedacted: true,
        injectionFlagged: false,
        flags: ['cpf_redacted'],
      });

      const job = { data: { phone: '+5511999990000', content: 'Meu CPF é 123.456.789-00' } };
      await service.processJob(job as any);

      expect(conversationService.handleInboundMessage).toHaveBeenCalledWith(
        '+5511999990000', 'Meu CPF é [CPF_REDACTED]', 'text',
      );
    });

    it('triggers progressive summary every 10 messages', async () => {
      conversationService.handleInboundMessage.mockResolvedValue({
        conversation: { id: 'conv-1', ownerType: 'ai', status: 'atendida_ia', summaryMessageCount: 9 },
        message: { id: 'msg-10' },
      });

      const job = { data: { phone: '+5511999990000', content: 'Oi' } };
      await service.processJob(job as any);

      expect(summaryService.generateProgressiveSummary).toHaveBeenCalledWith('conv-1');
    });

    it('skips progressive summary when not at threshold', async () => {
      const job = { data: { phone: '+5511999990000', content: 'Oi' } };
      await service.processJob(job as any);

      expect(summaryService.generateProgressiveSummary).not.toHaveBeenCalled();
    });
  });
});
