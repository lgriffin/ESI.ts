import { storeEntry } from '../../support/cache-components';
import { Given } from '../../support/steps';

Given(
  'the cache stores {string} with ETag {string}',
  function (url: string, etag: string) {
    storeEntry(this, url, etag);
  },
);
