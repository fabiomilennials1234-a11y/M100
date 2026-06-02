import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';

const ok = () => Promise.resolve('ok');
const fail = () => Promise.reject(new Error('boom'));

describe('CircuitBreaker', () => {
  afterEach(() => jest.useRealTimers());

  it('passes calls through while closed and returns results', async () => {
    const cb = new CircuitBreaker({ threshold: 3, cooldownMs: 1000 });
    expect(await cb.exec(ok)).toBe('ok');
  });

  it('opens after the failure threshold and then fails fast (no call through)', async () => {
    const cb = new CircuitBreaker({ threshold: 3, cooldownMs: 1000 });
    for (let i = 0; i < 3; i++) {
      await expect(cb.exec(fail)).rejects.toThrow('boom');
    }
    // Circuit now open — next call short-circuits without invoking fn.
    const fn = jest.fn(fail);
    await expect(cb.exec(fn)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(fn).not.toHaveBeenCalled();
  });

  it('half-opens after the cooldown and closes on a successful probe', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const cb = new CircuitBreaker({ threshold: 1, cooldownMs: 1000 });

    await expect(cb.exec(fail)).rejects.toThrow('boom'); // opens
    await expect(cb.exec(ok)).rejects.toBeInstanceOf(CircuitOpenError); // still open

    jest.setSystemTime(new Date('2026-01-01T00:00:02Z')); // past cooldown
    expect(await cb.exec(ok)).toBe('ok'); // half-open probe succeeds → closed

    // Closed again: a fresh failure is allowed through (not short-circuited).
    await expect(cb.exec(fail)).rejects.toThrow('boom');
  });

  it('allows only one probe in half-open under concurrency', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const cb = new CircuitBreaker({ threshold: 1, cooldownMs: 1000 });
    await expect(cb.exec(fail)).rejects.toThrow('boom'); // opens

    jest.setSystemTime(new Date('2026-01-01T00:00:02Z')); // cooled → half-open
    let release!: (v: string) => void;
    const slow = jest.fn(() => new Promise<string>((r) => { release = r; }));
    const second = jest.fn(ok);

    const p1 = cb.exec(slow); // becomes the single probe (pending)
    const p2 = cb.exec(second); // concurrent → must fail fast

    await expect(p2).rejects.toBeInstanceOf(CircuitOpenError);
    expect(second).not.toHaveBeenCalled();

    release('ok');
    expect(await p1).toBe('ok');
    expect(slow).toHaveBeenCalledTimes(1);
  });

  it('re-opens if the half-open probe fails', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const cb = new CircuitBreaker({ threshold: 1, cooldownMs: 1000 });

    await expect(cb.exec(fail)).rejects.toThrow('boom'); // opens
    jest.setSystemTime(new Date('2026-01-01T00:00:02Z'));
    await expect(cb.exec(fail)).rejects.toThrow('boom'); // half-open probe fails → re-open

    const fn = jest.fn(ok);
    await expect(cb.exec(fn)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(fn).not.toHaveBeenCalled();
  });
});
