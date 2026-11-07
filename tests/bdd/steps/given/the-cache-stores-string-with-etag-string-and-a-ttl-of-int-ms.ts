import { storeEntry } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given(
  'the cache stores {string} with ETag {string} and a TTL of {int} ms',
  function (url: string, etag: string, ttl: number) {
    storeEntry(this, url, etag, ttl);
  },
);
