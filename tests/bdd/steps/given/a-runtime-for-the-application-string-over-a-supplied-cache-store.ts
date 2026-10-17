import { createSeamRuntime, MapCacheStore } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a runtime for the application {string} over a supplied cache store',
  function (userAgent: string) {
    const cacheStore = new MapCacheStore();
    this.values.cacheStore = cacheStore;
    this.esi = createSeamRuntime({ userAgent, cache: cacheStore });
  },
);
