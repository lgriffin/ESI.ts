import { logWarn, logInfo } from '../logger/loggerUtil';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenMaxAttempts?: number;
}

interface CircuitRecord {
  state: CircuitState;
  failures: number;
  lastFailureTime: number;
  halfOpenAttempts: number;
}

export class CircuitBreaker {
  private circuits: Map<string, CircuitRecord> = new Map();
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly halfOpenMaxAttempts: number;

  constructor(config: CircuitBreakerConfig = {}) {
    this.failureThreshold = config.failureThreshold ?? 5;
    this.resetTimeoutMs = config.resetTimeoutMs ?? 30_000;
    this.halfOpenMaxAttempts = config.halfOpenMaxAttempts ?? 1;
  }

  private getKey(endpoint: string): string {
    return endpoint.split('?')[0];
  }

  private getOrCreate(key: string): CircuitRecord {
    let record = this.circuits.get(key);
    if (!record) {
      record = {
        state: 'closed',
        failures: 0,
        lastFailureTime: 0,
        halfOpenAttempts: 0,
      };
      this.circuits.set(key, record);
    }
    return record;
  }

  checkCircuit(endpoint: string): void {
    const key = this.getKey(endpoint);
    const record = this.getOrCreate(key);

    if (record.state === 'closed') return;

    if (record.state === 'open') {
      const elapsed = Date.now() - record.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        record.state = 'half-open';
        record.halfOpenAttempts = 0;
        logInfo(`Circuit half-open for ${key}, allowing probe request`);
        return;
      }
      const remainingMs = this.resetTimeoutMs - elapsed;
      throw new CircuitOpenError(key, record.failures, remainingMs);
    }

    if (record.state === 'half-open') {
      if (record.halfOpenAttempts >= this.halfOpenMaxAttempts) {
        throw new CircuitOpenError(key, record.failures, this.resetTimeoutMs);
      }
      record.halfOpenAttempts++;
    }
  }

  recordSuccess(endpoint: string): void {
    const key = this.getKey(endpoint);
    const record = this.circuits.get(key);
    if (!record) return;

    if (record.state === 'half-open') {
      logInfo(`Circuit closed for ${key} after successful probe`);
    }

    record.state = 'closed';
    record.failures = 0;
    record.halfOpenAttempts = 0;
  }

  recordFailure(endpoint: string, statusCode: number): void {
    if (statusCode < 500) return;

    const key = this.getKey(endpoint);
    const record = this.getOrCreate(key);

    record.failures++;
    record.lastFailureTime = Date.now();

    if (record.state === 'half-open') {
      record.state = 'open';
      logWarn(
        `Circuit re-opened for ${key} after failed probe (${record.failures} failures)`,
      );
      return;
    }

    if (record.failures >= this.failureThreshold) {
      record.state = 'open';
      logWarn(
        `Circuit opened for ${key} after ${record.failures} consecutive 5xx failures`,
      );
    }
  }

  getState(endpoint: string): CircuitState {
    const key = this.getKey(endpoint);
    const record = this.circuits.get(key);
    if (!record) return 'closed';

    if (record.state === 'open') {
      const elapsed = Date.now() - record.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        return 'half-open';
      }
    }

    return record.state;
  }

  getStats(): {
    totalCircuits: number;
    openCircuits: number;
    circuits: Record<string, { state: CircuitState; failures: number }>;
  } {
    const circuits: Record<string, { state: CircuitState; failures: number }> =
      {};
    let openCircuits = 0;

    for (const [key, record] of this.circuits.entries()) {
      const state = this.getState(key);
      // eslint-disable-next-line security/detect-object-injection
      circuits[key] = { state, failures: record.failures };
      if (state === 'open') openCircuits++;
    }

    return {
      totalCircuits: this.circuits.size,
      openCircuits,
      circuits,
    };
  }

  reset(endpoint?: string): void {
    if (endpoint) {
      this.circuits.delete(this.getKey(endpoint));
    } else {
      this.circuits.clear();
    }
  }
}

export class CircuitOpenError extends Error {
  readonly endpoint: string;
  readonly failures: number;
  readonly retryAfterMs: number;

  constructor(endpoint: string, failures: number, retryAfterMs: number) {
    super(
      `Circuit breaker open for ${endpoint} after ${failures} failures (retry after ${Math.ceil(retryAfterMs / 1000)}s)`,
    );
    this.name = 'CircuitOpenError';
    this.endpoint = endpoint;
    this.failures = failures;
    this.retryAfterMs = retryAfterMs;
  }
}
