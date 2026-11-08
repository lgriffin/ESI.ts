import { cacheOf } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then(
  'reading {string} from the cache shall give ETag {string}',
  function (url: string, etag: string) {
    expect(cacheOf(this).getETag(url)).toBe(etag);
  },
);
