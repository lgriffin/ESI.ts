import * as ESI from '../../../src/index';
import * as schemas from '../../../src/schemas';
import { EsiError } from '../../../src/core/util/error';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { CircuitBreaker } from '../../../src/core/circuitBreaker/CircuitBreaker';

describe('API surface snapshots', () => {
  it('public API exports should match snapshot', () => {
    expect(Object.keys(ESI).sort()).toMatchSnapshot();
  });

  it('schema exports should match snapshot', () => {
    expect(Object.keys(schemas).sort()).toMatchSnapshot();
  });

  it('EsiError shape should match snapshot', () => {
    const err = new EsiError(404, 'test', 'http://test.com', 'req-1');
    const protoMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(err))
      .filter(
        (k) =>
          typeof (err as unknown as Record<string, unknown>)[k] === 'function',
      )
      .sort();
    const shape = {
      ownProperties: Object.getOwnPropertyNames(err).sort(),
      methods: protoMethods,
    };
    expect(shape).toMatchSnapshot();
  });

  it('RateLimiter status shape should match snapshot', () => {
    const limiter = new RateLimiter();
    limiter.setTestMode(true);
    const status = limiter.getStatus();
    expect(Object.keys(status).sort()).toMatchSnapshot();
  });

  it('CircuitBreaker stats shape should match snapshot', () => {
    const cb = new CircuitBreaker();
    const stats = cb.getStats();
    expect(Object.keys(stats).sort()).toMatchSnapshot();
  });
});
