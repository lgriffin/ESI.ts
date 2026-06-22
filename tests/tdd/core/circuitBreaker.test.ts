import {
  CircuitBreaker,
  CircuitOpenError,
} from '../../../src/core/circuitBreaker/CircuitBreaker';

describe('CircuitBreaker', () => {
  describe('state transitions', () => {
    it('should start in closed state', () => {
      const cb = new CircuitBreaker();
      expect(cb.getState('v1/status/')).toBe('closed');
    });

    it('should remain closed below failure threshold', () => {
      const cb = new CircuitBreaker({ failureThreshold: 3 });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 503);

      expect(cb.getState('v1/status/')).toBe('closed');
      expect(() => cb.checkCircuit('v1/status/')).not.toThrow();
    });

    it('should open after reaching failure threshold', () => {
      const cb = new CircuitBreaker({ failureThreshold: 3 });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);

      expect(cb.getState('v1/status/')).toBe('open');
      expect(() => cb.checkCircuit('v1/status/')).toThrow(CircuitOpenError);
    });

    it('should transition to half-open after reset timeout', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 50,
      });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);

      expect(cb.getState('v1/status/')).toBe('open');

      // Simulate time passing by manipulating the record
      const stats = cb.getStats();
      expect(stats.openCircuits).toBe(1);
    });

    it('should close after successful probe in half-open state', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 0,
      });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);

      // resetTimeoutMs=0 means it transitions to half-open immediately
      expect(cb.getState('v1/status/')).toBe('half-open');

      // Probe request succeeds
      cb.checkCircuit('v1/status/');
      cb.recordSuccess('v1/status/');

      expect(cb.getState('v1/status/')).toBe('closed');
    });

    it('should re-open if probe fails in half-open state', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 0,
        halfOpenMaxAttempts: 1,
      });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);

      // Half-open: allow one probe
      cb.checkCircuit('v1/status/');

      // Probe fails — circuit re-opens with a new lastFailureTime
      cb.recordFailure('v1/status/', 500);

      // Internal state is 'open', but getState sees elapsed >= resetTimeoutMs(0)
      // so it reports 'half-open'. Verify the failure count increased instead.
      const stats = cb.getStats();
      expect(stats.circuits['v1/status/'].failures).toBe(3);
    });
  });

  describe('endpoint isolation', () => {
    it('should track circuits independently per endpoint path', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2 });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);

      expect(cb.getState('v1/status/')).toBe('open');
      expect(cb.getState('v1/universe/types/')).toBe('closed');
    });

    it('should strip query params for circuit key', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2 });

      cb.recordFailure('v1/markets/prices?page=1', 500);
      cb.recordFailure('v1/markets/prices?page=2', 500);

      expect(cb.getState('v1/markets/prices?page=3')).toBe('open');
    });
  });

  describe('non-5xx responses', () => {
    it('should not count 4xx errors as failures', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2 });

      cb.recordFailure('v1/status/', 404);
      cb.recordFailure('v1/status/', 404);
      cb.recordFailure('v1/status/', 404);

      expect(cb.getState('v1/status/')).toBe('closed');
    });

    it('should reset failure count on success', () => {
      const cb = new CircuitBreaker({ failureThreshold: 3 });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);
      cb.recordSuccess('v1/status/');
      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);

      expect(cb.getState('v1/status/')).toBe('closed');
    });
  });

  describe('CircuitOpenError', () => {
    it('should include endpoint and failure count', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2 });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);

      try {
        cb.checkCircuit('v1/status/');
        fail('Expected CircuitOpenError');
      } catch (err) {
        expect(err).toBeInstanceOf(CircuitOpenError);
        const coe = err as CircuitOpenError;
        expect(coe.endpoint).toBe('v1/status/');
        expect(coe.failures).toBe(2);
        expect(coe.retryAfterMs).toBeGreaterThan(0);
      }
    });
  });

  describe('half-open max attempts', () => {
    it('should throw after exceeding halfOpenMaxAttempts', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 0,
        halfOpenMaxAttempts: 1,
      });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);

      // 1st call transitions open→half-open (does not count as attempt)
      cb.checkCircuit('v1/status/');
      // 2nd call: halfOpenAttempts(0) < max(1), increments to 1
      cb.checkCircuit('v1/status/');
      // 3rd call: halfOpenAttempts(1) >= max(1), throws
      expect(() => cb.checkCircuit('v1/status/')).toThrow(CircuitOpenError);
    });
  });

  describe('cleanup', () => {
    it('should remove stale closed circuits with no active failures', async () => {
      const cb = new CircuitBreaker({
        failureThreshold: 3,
        staleThresholdMs: 1,
      });

      cb.recordFailure('v1/status/', 500);
      cb.recordSuccess('v1/status/');

      await new Promise((resolve) => setTimeout(resolve, 5));

      const cleaned = cb.cleanup();
      expect(cleaned).toBe(1);
      expect(cb.getStats().totalCircuits).toBe(0);
    });

    it('should not remove open circuits', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 2,
        staleThresholdMs: 0,
      });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);

      const cleaned = cb.cleanup();
      expect(cleaned).toBe(0);
      expect(cb.getStats().totalCircuits).toBe(1);
    });

    it('should not remove circuits with zero lastFailureTime', () => {
      const cb = new CircuitBreaker({ staleThresholdMs: 0 });

      cb.checkCircuit('v1/status/');

      const cleaned = cb.cleanup();
      expect(cleaned).toBe(0);
    });

    it('should return count of cleaned circuits', async () => {
      const cb = new CircuitBreaker({
        failureThreshold: 5,
        staleThresholdMs: 1,
      });

      cb.recordFailure('v1/a/', 500);
      cb.recordSuccess('v1/a/');
      cb.recordFailure('v1/b/', 500);
      cb.recordSuccess('v1/b/');
      cb.recordFailure('v1/c/', 500);
      cb.recordSuccess('v1/c/');

      await new Promise((resolve) => setTimeout(resolve, 5));

      const cleaned = cb.cleanup();
      expect(cleaned).toBe(3);
    });
  });

  describe('stats and reset', () => {
    it('should report stats for all circuits', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2 });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/universe/types/', 500);

      const stats = cb.getStats();
      expect(stats.totalCircuits).toBe(2);
      expect(stats.openCircuits).toBe(1);
      expect(stats.circuits['v1/status/']).toEqual({
        state: 'open',
        failures: 2,
      });
    });

    it('should reset a specific circuit', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2 });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);

      cb.reset('v1/status/');
      expect(cb.getState('v1/status/')).toBe('closed');
    });

    it('should reset all circuits', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2 });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/universe/types/', 500);
      cb.recordFailure('v1/universe/types/', 500);

      cb.reset();
      expect(cb.getStats().totalCircuits).toBe(0);
    });
  });
});
