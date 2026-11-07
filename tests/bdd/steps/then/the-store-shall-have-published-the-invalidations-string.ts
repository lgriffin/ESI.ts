import { storeOf } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then(
  'the store shall have published the invalidations {string}',
  function (events: string) {
    const published = storeOf(this).published.map((e) =>
      e.kind === 'path' ? `path ${e.path}` : e.kind,
    );
    expect(published.join(', ')).toBe(events);
  },
);
