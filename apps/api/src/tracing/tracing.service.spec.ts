import { NoopTracingProvider } from './noop-tracing.provider';
import { LangfuseTracingProvider } from './langfuse-tracing.provider';
import { TracingProvider } from '@motor100/shared';

const mockSpan = { end: jest.fn() };
const mockTrace = {
  span: jest.fn().mockReturnValue(mockSpan),
  update: jest.fn(),
};
const mockLangfuse = {
  trace: jest.fn().mockReturnValue(mockTrace),
};

jest.mock('langfuse', () => ({
  Langfuse: jest.fn().mockImplementation(() => mockLangfuse),
}));

describe('TracingModule', () => {
  describe('NoopTracingProvider', () => {
    let provider: TracingProvider;

    beforeEach(() => {
      provider = new NoopTracingProvider();
    });

    it('startTrace returns trace with working methods', () => {
      const trace = provider.startTrace('conv-123');
      expect(trace).toBeDefined();
      expect(() => trace.end()).not.toThrow();
    });

    it('startSpan returns span that ends without error', () => {
      const trace = provider.startTrace('conv-123');
      const span = trace.startSpan('debounce');
      expect(span).toBeDefined();
      expect(() => span.end({ result: 'ok' })).not.toThrow();
    });

    it('supports metadata on trace and span', () => {
      const trace = provider.startTrace('conv-123', { phone: '+55' });
      const span = trace.startSpan('ai', { model: 'gpt-4' });
      expect(() => {
        span.end({ tokens: 100 });
        trace.end();
      }).not.toThrow();
    });
  });

  describe('TracingModule factory', () => {
    it('returns NoopTracingProvider when env vars missing', async () => {
      delete process.env.LANGFUSE_PUBLIC_KEY;
      delete process.env.LANGFUSE_SECRET_KEY;

      const { TracingModule, TRACING_PROVIDER } = await import('./tracing.module');
      const { Test } = await import('@nestjs/testing');

      const module = await Test.createTestingModule({
        imports: [TracingModule],
      }).compile();

      const provider = module.get(TRACING_PROVIDER);
      expect(provider).toBeInstanceOf(NoopTracingProvider);
    });
  });

  describe('LangfuseTracingProvider', () => {
    let provider: LangfuseTracingProvider;

    beforeEach(() => {
      provider = new LangfuseTracingProvider({
        publicKey: 'test-pub',
        secretKey: 'test-secret',
        baseUrl: 'http://localhost:3000',
      });
    });

    it('creates trace with conversationId', () => {
      const trace = provider.startTrace('conv-456');
      expect(trace).toBeDefined();
    });

    it('creates nested spans within trace', () => {
      const trace = provider.startTrace('conv-456');
      const span = trace.startSpan('channel-receive');
      expect(span).toBeDefined();
      span.end({ received: true });
      trace.end();
    });
  });
});
