import {
  INSURANCE_PRICES_PATH,
  insuranceFixtures,
} from '../../support/insurance';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('insurance prices are available for payout verification', function () {
  queueResponse({
    match: INSURANCE_PRICES_PATH,
    body: insuranceFixtures.payoutTiers(),
  });
});
