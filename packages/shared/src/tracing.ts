export interface TracingSpan {
  end(result?: Record<string, unknown>): void;
}

export interface TracingTrace {
  startSpan(name: string, metadata?: Record<string, unknown>): TracingSpan;
  end(): void;
}

export interface TracingProvider {
  startTrace(conversationId: string, metadata?: Record<string, unknown>): TracingTrace;
}
