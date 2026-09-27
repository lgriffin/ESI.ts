import { queueWalletBalance } from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given("ESI reports the character's wallet balance twice", function () {
  queueWalletBalance(2);
});
