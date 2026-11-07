import type { PageResult } from '../../../../src/core/pagination/AsyncPaginationIterator';
import { Then } from '../../support/steps';

Then(
  'the stream shall have yielded {int} page reporting {int} page in total',
  function (count: number, total: number) {
    expect(this.error).toBeUndefined();
    const pages = this.result as PageResult[];
    expect(pages).toHaveLength(count);
    for (const page of pages) expect(page.totalPages).toBe(total);
  },
);
