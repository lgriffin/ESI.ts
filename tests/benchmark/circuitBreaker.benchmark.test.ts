import { CircuitBreaker } from '../../src/core/circuitBreaker/CircuitBreaker';

describe('CircuitBreaker benchmarks', () => {
  it('checkCircuit (closed state): 100K calls under 1s', () => {
    const cb = new CircuitBreaker();

    const start = performance.now();

    for (let i = 0; i < 100_000; i++) {
      cb.checkCircuit('/v1/status/');
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });

  it('state transition cycling: 1K cycles under 2s', () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 0 });

    const start = performance.now();

    for (let i = 0; i < 1_000; i++) {
      const endpoint = `/v1/endpoint-${i}/`;
      cb.recordFailure(endpoint, 500);
      cb.recordFailure(endpoint, 500);
      try {
        cb.checkCircuit(endpoint);
      } catch {
        // expected - circuit is open
      }
      cb.recordSuccess(endpoint);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  it('getStats with 200 endpoints under 500ms', () => {
    const cb = new CircuitBreaker();

    for (let i = 0; i < 200; i++) {
      cb.checkCircuit(`/v1/endpoint-${i}/`);
      if (i % 3 === 0) {
        cb.recordFailure(`/v1/endpoint-${i}/`, 500);
      }
    }

    const start = performance.now();

    for (let i = 0; i < 1_000; i++) {
      cb.getStats();
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it('checkCircuit with many distinct endpoints under 2s', () => {
    const cb = new CircuitBreaker();

    const start = performance.now();

    for (let i = 0; i < 10_000; i++) {
      cb.checkCircuit(`/v1/endpoint-${i}/`);
    }

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });
});
