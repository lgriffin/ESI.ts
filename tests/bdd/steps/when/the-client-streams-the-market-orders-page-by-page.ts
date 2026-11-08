import type { PageResult } from '../../../../src/core/pagination/AsyncPaginationIterator';
import { captureOutcome } from '../../support/outcome';
import { PAGED_REGION_ID } from '../../support/paging';
import { When } from '../../support/steps';

When('the client streams the market orders page by page', async function () {
  await captureOutcome(this, async () => {
    const pages: PageResult[] = [];
    for await (const page of this.client.market.streamMarketOrders(
      PAGED_REGION_ID,
    )) {
      pages.push(page);
    }
    return pages;
  });
});
