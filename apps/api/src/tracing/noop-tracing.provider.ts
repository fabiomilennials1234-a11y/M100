import { TracingProvider, TracingTrace, TracingSpan } from '@motor100/shared';

const NOOP_SPAN: TracingSpan = { end: () => {} };

const NOOP_TRACE: TracingTrace = {
  startSpan: () => NOOP_SPAN,
  end: () => {},
};

export class NoopTracingProvider implements TracingProvider {
  startTrace(): TracingTrace {
    return NOOP_TRACE;
  }
}
