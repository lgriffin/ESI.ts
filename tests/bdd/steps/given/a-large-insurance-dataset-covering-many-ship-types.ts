import {
  INSURANCE_PRICES_PATH,
  insuranceFixtures,
} from '../../support/insurance';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a large insurance dataset covering many ship types', function () {
  queueResponse({
    match: INSURANCE_PRICES_PATH,
    body: insuranceFixtures.largePriceList(),
  });
});
