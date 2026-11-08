import { buildSurface, type Surface } from '../../support/client-construction';
import { MapCacheStore } from '../../support/shared-runtime';
import { CircuitBreaker } from '../../../../src/core/circuitBreaker/CircuitBreaker';
import { RequestDeduplicator } from '../../../../src/core/RequestDeduplicator';
import { Given } from '../../support/steps';

Given(
  'a client built by {word} given a cache store, a circuit breaker and a deduplicator',
  function (surface: string) {
    const cache = new MapCacheStore();
    const circuitBreaker = new CircuitBreaker();
    this.cleanups.push(() => circuitBreaker.shutdown());
    this.values.cacheStore = cache;
    buildSurface(this, surface as Surface, {
      cache,
      circuitBreaker,
      deduplicator: new RequestDeduplicator(),
    });
  },
);
