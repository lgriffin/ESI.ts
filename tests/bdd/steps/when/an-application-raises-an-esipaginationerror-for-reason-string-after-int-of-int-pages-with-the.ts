import {
  EsiPaginationError,
  type PaginationStopReason,
} from '../../../../src/core/util/error';
import { When } from '../../support/steps';

When(
  'an application raises an EsiPaginationError for reason {string} after {int} of {int} pages with the underlying error {string}',
  function (
    reason: string,
    fetchedPages: number,
    reportedPages: number,
    message: string,
  ) {
    this.error = new EsiPaginationError(
      'https://esi.evetech.net/markets/10000002/orders/',
      new Error(message),
      {
        reason: reason as PaginationStopReason,
        fetchedPages,
        reportedPages,
      },
    );
  },
);
