import {
  INSURANCE_PRICES_PATH,
  insuranceFixtures,
} from '../../support/insurance';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the insurance system is operational', function () {
  queueResponse({
    match: INSURANCE_PRICES_PATH,
    body: insuranceFixtures.frigateAndBattleship(),
  });
});
