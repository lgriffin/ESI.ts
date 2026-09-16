import { marketFixtures, marketPaths } from '../../support/market';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the market system is operational', function () {
  queueResponse({
    match: marketPaths.prices,
    body: marketFixtures.priceList(),
  });
});
