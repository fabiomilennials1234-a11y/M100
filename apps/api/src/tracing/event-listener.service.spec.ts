import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { EventListenerService } from './event-listener.service';
import { TRACING_PROVIDER } from './tracing.constants';
import { DomainEvent, TracingProvider, TracingTrace, TracingSpan } from '@motor100/shared';

function createMockTracing() {
  const endSpan = jest.fn();
  const span: TracingSpan = { end: endSpan };
  const startSpan = jest.fn().mockReturnValue(span);
  const endTrace = jest.fn();
  const trace: TracingTrace = { startSpan, end: endTrace };
  const startTrace = jest.fn().mockReturnValue(trace);
  const provider: TracingProvider = { startTrace };

  return { provider, startTrace, trace, startSpan, span, endSpan, endTrace };
}

describe('EventListenerService', () => {
  let service: EventListenerService;
  let emitter: EventEmitter2;
  let mock: ReturnType<typeof createMockTracing>;

  beforeEach(async () => {
    mock = createMockTracing();

    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        EventListenerService,
        { provide: TRACING_PROVIDER, useValue: mock.provider },
      ],
    }).compile();

    service = module.get(EventListenerService);
    emitter = module.get(EventEmitter2);

    await module.init();
  });

  it('OWNER_CHANGED creates tracing span with old/new owner', async () => {
    await emitter.emitAsync(DomainEvent.CONVERSATION_OWNER_CHANGED, {
      conversationId: 'conv-1',
      from: 'ai',
      to: 'agent',
    });

    expect(mock.startTrace).toHaveBeenCalledWith('conv-1', expect.objectContaining({ event: 'owner_changed' }));
    expect(mock.startSpan).toHaveBeenCalledWith('owner_changed', expect.objectContaining({ from: 'ai', to: 'agent' }));
    expect(mock.endSpan).toHaveBeenCalled();
    expect(mock.endTrace).toHaveBeenCalled();
  });

  it('MESSAGE_SENT creates tracing span for outbound tracking', async () => {
    await emitter.emitAsync(DomainEvent.MESSAGE_SENT, {
      conversationId: 'conv-2',
      message: { id: 'msg-1', direction: 'outbound' },
    });

    expect(mock.startTrace).toHaveBeenCalledWith('conv-2', expect.objectContaining({ event: 'message_sent' }));
    expect(mock.startSpan).toHaveBeenCalledWith('message_sent', expect.objectContaining({ messageId: 'msg-1' }));
    expect(mock.endSpan).toHaveBeenCalled();
  });

  it('HANDOFF_COMPLETED creates tracing span with agentId', async () => {
    await emitter.emitAsync(DomainEvent.HANDOFF_COMPLETED, {
      conversationId: 'conv-3',
      agentId: 'agent-42',
    });

    expect(mock.startTrace).toHaveBeenCalledWith('conv-3', expect.objectContaining({ event: 'handoff_completed' }));
    expect(mock.startSpan).toHaveBeenCalledWith('handoff_completed', expect.objectContaining({ agentId: 'agent-42' }));
    expect(mock.endSpan).toHaveBeenCalled();
  });

  it('AI_RESPONSE_GENERATED creates tracing span with action', async () => {
    await emitter.emitAsync(DomainEvent.AI_RESPONSE_GENERATED, {
      conversation: { id: 'conv-4' },
      decision: { action: 'respond', reason: 'faq_match' },
    });

    expect(mock.startTrace).toHaveBeenCalledWith('conv-4', expect.objectContaining({ event: 'ai_response_generated' }));
    expect(mock.startSpan).toHaveBeenCalledWith('ai_response_generated', expect.objectContaining({ action: 'respond', reason: 'faq_match' }));
    expect(mock.endSpan).toHaveBeenCalled();
  });

  it('listener errors are caught and logged, not propagated', async () => {
    mock.startTrace.mockImplementation(() => {
      throw new Error('tracing exploded');
    });

    // Should NOT throw
    await expect(
      emitter.emitAsync(DomainEvent.CONVERSATION_OWNER_CHANGED, {
        conversationId: 'conv-err',
        from: 'ai',
        to: 'agent',
      }),
    ).resolves.not.toThrow();
  });
});
