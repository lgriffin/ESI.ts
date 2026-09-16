import { WALLET_CORPORATION_ID, walletPaths } from '../../support/wallet';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a non-director character for corporation wallet', function () {
  queueError(403, 'Character does not have required role(s)', {
    match: walletPaths.corporationWallets(WALLET_CORPORATION_ID),
  });
});
