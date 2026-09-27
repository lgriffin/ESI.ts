import { ASSET_PAGE, transportOf } from '../../support/mock-transport';
import { Given } from '../../support/steps';

Given(
  'the mock transport answers {string} {string} with one asset on each of two pages',
  function (method: string, path: string) {
    transportOf(this).respond({
      method,
      path,
      body: ASSET_PAGE,
      headers: { 'x-pages': '2' },
    });
  },
);
