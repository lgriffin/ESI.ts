import {
  EsiPaginationError,
  type PaginationStopReason,
} from '../../../../src/core/util/error';
import { When } from '../../support/steps';

When(
  'an application raises an EsiPaginationError for reason {string} with no page count and no underlying error',
  function (reason: string) {
    this.error = new EsiPaginationError(
      'https://esi.evetech.net/markets/10000002/orders/',
      undefined,
      { reason: reason as PaginationStopReason },
    );
  },
);
