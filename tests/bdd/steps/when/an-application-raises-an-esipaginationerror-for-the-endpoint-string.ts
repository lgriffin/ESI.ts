import { EsiPaginationError } from '../../../../src/core/util/error';
import { When } from '../../support/steps';

When(
  'an application raises an EsiPaginationError for the endpoint {string}',
  function (endpoint: string) {
    this.error = new EsiPaginationError(
      `https://esi.evetech.net/${endpoint}`,
      undefined,
      { reason: 'page-cap', endpoint, reportedPages: 1001, fetchedPages: 1 },
    );
  },
);
