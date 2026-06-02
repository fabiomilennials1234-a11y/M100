export class CircuitOpenError extends Error {
  constructor() {
    super('circuit_open');
    this.name = 'CircuitOpenError';
  }
}

type State = 'closed' | 'open' | 'half-open';

interface Options {
  threshold: number;
  cooldownMs: number;
}

/**
 * Minimal circuit breaker. Protects an unreliable downstream (the on-premise
 * Flex ERP) from being hammered while it's down: after `threshold` consecutive
 * failures it opens and fails fast for `cooldownMs`, then allows a single
 * half-open probe — success closes it, failure re-opens it.
 */
export class CircuitBreaker {
  private state: State = 'closed';
  private failures = 0;
  private openedAt = 0;
  private probing = false;

  constructor(private readonly opts: Options) {}

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.opts.cooldownMs) {
        this.state = 'half-open';
      } else {
        throw new CircuitOpenError();
      }
    }

    // Half-open allows exactly ONE probe in flight; concurrent calls fail fast.
    if (this.state === 'half-open') {
      if (this.probing) {
        throw new CircuitOpenError();
      }
      this.probing = true;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
    this.probing = false;
  }

  private onFailure(): void {
    this.failures += 1;
    if (this.state === 'half-open' || this.failures >= this.opts.threshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
    this.probing = false;
  }
}
