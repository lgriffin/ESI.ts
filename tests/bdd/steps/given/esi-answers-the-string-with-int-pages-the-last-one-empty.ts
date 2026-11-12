import { servePagedCollection } from '../../support/paging-helpers';
import { Given } from '../../support/steps';

Given(
  'ESI answers the {string} with {int} pages, the last one empty',
  function (collection: string, pages: number) {
    servePagedCollection(
      this,
      collection,
      Array.from({ length: pages }, (_, i) => (i + 1 === pages ? 0 : 2)),
    );
  },
);
