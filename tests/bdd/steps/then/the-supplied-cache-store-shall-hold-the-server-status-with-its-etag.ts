import { serverStatus } from '../../support/request-headers';
import { type MapCacheStore, suppliedOf } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then(
  'the supplied cache store shall hold the server status with its ETag',
  function () {
    const store = suppliedOf<MapCacheStore>(this, 'cacheStore');
    expect([...store.entries.values()]).toEqual([
      expect.objectContaining({ etag: '"status-v1"', data: serverStatus() }),
    ]);
  },
);
