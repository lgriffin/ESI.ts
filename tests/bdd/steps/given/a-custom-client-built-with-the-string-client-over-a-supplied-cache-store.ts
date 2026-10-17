import { buildCustomClient } from '../../support/custom-client';
import { MapCacheStore } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given(
  'a custom client built with the {string} client over a supplied cache store',
  function (name: string) {
    const cacheStore = new MapCacheStore();
    this.values.cacheStore = cacheStore;
    buildCustomClient(this, [name], undefined, { cache: cacheStore });
  },
);
