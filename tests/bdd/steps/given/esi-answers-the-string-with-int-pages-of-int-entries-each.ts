import { servePagedCollection } from '../../support/paging-helpers';
import { Given } from '../../support/steps';

Given(
  'ESI answers the {string} with {int} pages of {int} entries each',
  function (collection: string, pages: number, entries: number) {
    servePagedCollection(
      this,
      collection,
      Array.from({ length: pages }, () => entries),
    );
  },
);
