import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageProcessorService } from './message-processor.service';
import { ConversationService } from '../conversation/conversation.service';
import { AiService } from '../ai/ai.service';
import { ChannelService } from '../channel/channel.service';
import { AIAction, DomainEvent } from '@motor100/shared';
import { getQueueToken } from '@nestjs/bullmq';

describe('MessageProcessorService', () => {
  let service: MessageProcessorService;
  let conversationService: any;
  let aiService: any;
  let channelService: any;
  let events: any;
  let mockQueue: any;

  beforeEach(async () => {
    conversationService = {
      handleInboundMessage: jest.fn().mockResolvedValue({
        conversation: { id: 'conv-1', ownerType: 'ai', status: 'atendida_ia' },
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

    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageProcessorService,
        { provide: ConversationService, useValue: conversationService },
        { provide: AiService, useValue: aiService },
        { provide: ChannelService, useValue: channelService },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: getQueueToken('message-processing'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get(MessageProcessorService);
    events = module.get(EventEmitter2);
  });

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
      '+5511999990000', 'Qual prazo?', 'text',
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
});
