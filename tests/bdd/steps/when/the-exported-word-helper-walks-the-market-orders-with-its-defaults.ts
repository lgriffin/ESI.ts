import type { ApiClient } from '../../../../src/core/ApiClient';
import {
  fetchAllPages,
  fetchPages,
} from '../../../../src/core/pagination/AsyncPaginationIterator';
import { captureOutcome } from '../../support/outcome';
import { ORDERS_PATH } from '../../support/paging';
import { When } from '../../support/steps';

When(
  'the exported {word} helper walks the market orders with its defaults',
  async function (helper: string) {
    const api = (this.client as unknown as { apiClient: ApiClient }).apiClient;
    await captureOutcome(this, async () => {
      if (helper === 'fetchAllPages') {
        return fetchAllPages(api, ORDERS_PATH, 'GET');
      }
      const orders: unknown[] = [];
      for await (const page of fetchPages(api, ORDERS_PATH, 'GET')) {
        orders.push(...page.data);
      }
      return orders;
    });
  },
);
