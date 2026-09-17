// Time arrives through parameters; nothing here reads a clock or a timer.
export interface Clock {
  now(): number;
  sleep(ms: number): Promise<void>;
  random(): number;
}

export class Cache {
  constructor(private readonly clock: Clock) {}

  isExpired(storedAt: number, ttlMs: number): boolean {
    return this.clock.now() - storedAt > ttlMs;
  }

  expiresAt(header: string): Date {
    return new Date(header);
  }

  parse(header: string): number {
    return Date.parse(header);
  }

  async backoff(attempt: number): Promise<void> {
    const jitter = 0.75 + this.clock.random() * 0.5;
    await this.clock.sleep(2 ** attempt * 100 * jitter);
  }
}

export class ApiClientLike {
  private timeoutMs = 0;

  // A method named like a timer global is not the global.
  setTimeout(timeoutMs: number): void {
    this.timeoutMs = timeoutMs;
  }

  configure(other: ApiClientLike, setInterval: (ms: number) => void): void {
    other.setTimeout(this.timeoutMs);
    setInterval(this.timeoutMs);
  }
}
