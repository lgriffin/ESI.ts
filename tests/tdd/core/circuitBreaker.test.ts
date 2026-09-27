import {
  CircuitBreaker,
  CircuitOpenError,
  CircuitBreakerConfig,
} from '../../../src/core/circuitBreaker/CircuitBreaker';

/**
 * Every test runs on Jest's fake clock: the breaker reads Date.now() and
 * schedules its cleanup with setInterval, and a test on the real clock passes
 * or fails a boundary mutant (>= against >) depending on whether a
 * millisecond ticks between two calls. Time moves only when a test advances it.
 */
const START = 1_000_000;

describe('CircuitBreaker', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: START });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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
      expect(cb.getStats().openCircuits).toBe(1);

      // One millisecond short of the reset timeout: still open.
      jest.advanceTimersByTime(49);
      expect(cb.getState('v1/status/')).toBe('open');
      expect(() => cb.checkCircuit('v1/status/')).toThrow(CircuitOpenError);

      // At exactly resetTimeoutMs the circuit reports half-open.
      jest.advanceTimersByTime(1);
      expect(cb.getState('v1/status/')).toBe('half-open');
      expect(cb.getStats().openCircuits).toBe(0);
      expect(() => cb.checkCircuit('v1/status/')).not.toThrow();
    });

    it('reports the time left until the probe in CircuitOpenError', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeoutMs: 1000,
      });

      cb.recordFailure('v1/status/', 500);
      jest.advanceTimersByTime(400);

      expect(() => cb.checkCircuit('v1/status/')).toThrow(
        expect.objectContaining({ retryAfterMs: 600 }),
      );
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

    it('re-opens for a full reset timeout, timed from the failed probe', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 100,
      });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);
      jest.advanceTimersByTime(100);
      cb.checkCircuit('v1/status/'); // the probe

      jest.advanceTimersByTime(30);
      cb.recordFailure('v1/status/', 500);

      expect(cb.getState('v1/status/')).toBe('open');
      jest.advanceTimersByTime(99);
      expect(cb.getState('v1/status/')).toBe('open');
      jest.advanceTimersByTime(1);
      expect(cb.getState('v1/status/')).toBe('half-open');
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

  describe('rate-limit responses', () => {
    it('should count 429 Too Many Requests as a failure', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2 });

      cb.recordFailure('v1/status/', 429);
      cb.recordFailure('v1/status/', 429);

      expect(cb.getState('v1/status/')).toBe('open');
    });

    it('should count 420 Error Limited as a failure', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2 });

      cb.recordFailure('v1/status/', 420);
      cb.recordFailure('v1/status/', 420);

      expect(cb.getState('v1/status/')).toBe('open');
    });

    it('should not count other 4xx as failures', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2 });

      cb.recordFailure('v1/status/', 400);
      cb.recordFailure('v1/status/', 403);
      cb.recordFailure('v1/status/', 404);

      expect(cb.getState('v1/status/')).toBe('closed');
    });

    it('should count network failures (status 0) as failures', () => {
      const cb = new CircuitBreaker({ failureThreshold: 2 });

      cb.recordFailure('v1/status/', 0);
      cb.recordFailure('v1/status/', 0);

      expect(cb.getState('v1/status/')).toBe('open');
    });

    it('should open circuit with mixed rate-limit and 5xx failures', () => {
      const cb = new CircuitBreaker({ failureThreshold: 3 });

      cb.recordFailure('v1/status/', 429);
      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 420);

      expect(cb.getState('v1/status/')).toBe('open');
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
        // No time has passed since the second failure: the whole default
        // reset timeout (30s) remains.
        expect(coe.retryAfterMs).toBe(30_000);
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

      // 1st call transitions open→half-open and is the one allowed probe
      cb.checkCircuit('v1/status/');
      // 2nd call: halfOpenAttempts(1) >= max(1), throws
      expect(() => cb.checkCircuit('v1/status/')).toThrow(CircuitOpenError);
    });

    it('should admit exactly halfOpenMaxAttempts probes, counting the transition call', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 1,
        resetTimeoutMs: 0,
        halfOpenMaxAttempts: 3,
      });

      cb.recordFailure('v1/status/', 503);

      cb.checkCircuit('v1/status/');
      cb.checkCircuit('v1/status/');
      cb.checkCircuit('v1/status/');
      expect(() => cb.checkCircuit('v1/status/')).toThrow(CircuitOpenError);
    });
  });

  describe('cleanup', () => {
    it('should remove stale closed circuits with no active failures', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 3,
        staleThresholdMs: 1,
      });

      cb.recordFailure('v1/status/', 500);
      cb.recordSuccess('v1/status/');

      jest.advanceTimersByTime(5);

      const cleaned = cb.cleanup();
      expect(cleaned).toBe(1);
      expect(cb.getStats().totalCircuits).toBe(0);
    });

    it('keeps a circuit until strictly more than staleThresholdMs has passed', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 3,
        staleThresholdMs: 100,
      });

      cb.recordFailure('v1/status/', 500);
      cb.recordSuccess('v1/status/');

      jest.advanceTimersByTime(100);
      expect(cb.cleanup()).toBe(0);
      expect(cb.getStats().totalCircuits).toBe(1);

      jest.advanceTimersByTime(1);
      expect(cb.cleanup()).toBe(1);
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

    it('should return count of cleaned circuits', () => {
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

      jest.advanceTimersByTime(5);

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

  describe('key strategy', () => {
    it('should default to resolved key strategy', () => {
      const cb = new CircuitBreaker();
      expect(cb.getKeyStrategy()).toBe('resolved');
    });

    it('should accept template key strategy', () => {
      const cb = new CircuitBreaker({ keyStrategy: 'template' });
      cb.destroy();
      expect(cb.getKeyStrategy()).toBe('template');
    });

    it('should isolate resolved paths by default (different characters)', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 2,
        cleanupIntervalMs: 0,
      });

      cb.recordFailure('characters/1/orders/', 500);
      cb.recordFailure('characters/1/orders/', 500);

      expect(cb.getState('characters/1/orders/')).toBe('open');
      expect(cb.getState('characters/2/orders/')).toBe('closed');
    });

    it('should group under same circuit when template key is used directly', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 2,
        keyStrategy: 'template',
        cleanupIntervalMs: 0,
      });

      // When keyStrategy is 'template', the caller (ApiRequestHandler)
      // passes the template path. Here we simulate that by passing the
      // template path directly to the CB methods.
      const templateKey = 'characters/{character_id}/orders/';

      cb.recordFailure(templateKey, 500);
      cb.recordFailure(templateKey, 500);

      expect(cb.getState(templateKey)).toBe('open');
    });
  });

  describe('half-open probe slot release', () => {
    it('should allow re-probing after failure releases slot', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeoutMs: 0,
        halfOpenMaxAttempts: 1,
      });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);

      // Transitions to half-open and allows probe
      cb.checkCircuit('v1/status/');

      // Simulate an early throw: recordFailure with status 0 releases the slot
      cb.recordFailure('v1/status/', 0);

      // After the probe failure, circuit should re-open.
      // With resetTimeoutMs=0, getState sees it as half-open again.
      // A new probe should be allowed (half-open attempts reset on re-open).
      cb.checkCircuit('v1/status/');
      // The probe is allowed, verifying slot is not permanently wasted
      cb.recordSuccess('v1/status/');
      expect(cb.getState('v1/status/')).toBe('closed');
    });
  });

  describe('scheduled cleanup', () => {
    it('should automatically clean stale circuits on timer', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 5,
        staleThresholdMs: 1,
        cleanupIntervalMs: 10,
      });

      cb.recordFailure('v1/a/', 500);
      cb.recordSuccess('v1/a/');

      expect(cb.getStats().totalCircuits).toBe(1);

      // The timer has not fired yet one millisecond before the interval.
      jest.advanceTimersByTime(9);
      expect(cb.getStats().totalCircuits).toBe(1);

      // It fires at exactly cleanupIntervalMs.
      jest.advanceTimersByTime(1);
      expect(cb.getStats().totalCircuits).toBe(0);

      cb.destroy();
    });

    it('schedules one repeating cleanup at cleanupIntervalMs', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const cb = new CircuitBreaker({
        failureThreshold: 5,
        staleThresholdMs: 1,
        cleanupIntervalMs: 10,
      });

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10);
      expect(jest.getTimerCount()).toBe(1);
      setIntervalSpy.mockRestore();

      // The interval repeats: a circuit that goes stale after the first tick
      // is removed on a later one.
      jest.advanceTimersByTime(10);
      cb.recordFailure('v1/a/', 500);
      cb.recordSuccess('v1/a/');
      jest.advanceTimersByTime(10);
      expect(cb.getStats().totalCircuits).toBe(0);

      cb.destroy();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should not start cleanup timer when cleanupIntervalMs is 0', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const cb = new CircuitBreaker({ cleanupIntervalMs: 0 });
      expect(setIntervalSpy).not.toHaveBeenCalled();
      setIntervalSpy.mockRestore();

      // Should not throw or have issues
      cb.recordFailure('v1/a/', 500);
      cb.recordSuccess('v1/a/');

      cb.destroy();
    });
  });

  describe('destroy', () => {
    it('should clear the cleanup timer and circuits', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 2,
        cleanupIntervalMs: 100,
      });

      cb.recordFailure('v1/status/', 500);
      cb.recordFailure('v1/status/', 500);

      expect(cb.getStats().totalCircuits).toBe(1);

      cb.destroy();

      expect(cb.getStats().totalCircuits).toBe(0);
    });

    it('should be safe to call destroy multiple times', () => {
      const cb = new CircuitBreaker({ cleanupIntervalMs: 100 });

      cb.destroy();
      expect(() => cb.destroy()).not.toThrow();
    });

    it('should stop scheduled cleanup after destroy', () => {
      const cb = new CircuitBreaker({
        failureThreshold: 5,
        staleThresholdMs: 1,
        cleanupIntervalMs: 10,
      });

      cb.destroy();

      // Add a stale circuit after destroy
      cb.recordFailure('v1/a/', 500);
      cb.recordSuccess('v1/a/');

      expect(jest.getTimerCount()).toBe(0);
      jest.advanceTimersByTime(50);

      // Timer was cleared, so automatic cleanup should not have run
      expect(cb.getStats().totalCircuits).toBe(1);
    });

    it('shutdown should delegate to destroy', () => {
      const cb = new CircuitBreaker({ cleanupIntervalMs: 100 });

      cb.recordFailure('v1/status/', 500);

      cb.shutdown();

      expect(cb.getStats().totalCircuits).toBe(0);
    });
  });
});
