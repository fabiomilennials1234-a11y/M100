import { Langfuse } from 'langfuse';
import { TracingProvider, TracingTrace, TracingSpan } from '@motor100/shared';

interface LangfuseConfig {
  publicKey: string;
  secretKey: string;
  baseUrl?: string;
}

class LangfuseSpan implements TracingSpan {
  constructor(private readonly span: any) {}

  end(result?: Record<string, unknown>): void {
    this.span.end({ output: result });
  }
}

class LangfuseTrace implements TracingTrace {
  constructor(private readonly trace: any) {}

  startSpan(name: string, metadata?: Record<string, unknown>): TracingSpan {
    const span = this.trace.span({ name, metadata });
    return new LangfuseSpan(span);
  }

  end(): void {
    this.trace.update({ output: { status: 'completed' } });
  }
}

export class LangfuseTracingProvider implements TracingProvider {
  private readonly langfuse: Langfuse;

  constructor(config: LangfuseConfig) {
    this.langfuse = new Langfuse({
      publicKey: config.publicKey,
      secretKey: config.secretKey,
      baseUrl: config.baseUrl,
    });
  }

  startTrace(conversationId: string, metadata?: Record<string, unknown>): TracingTrace {
    const trace = this.langfuse.trace({
      name: `conversation-${conversationId}`,
      metadata: { conversationId, ...metadata },
    });
    return new LangfuseTrace(trace);
  }
}
