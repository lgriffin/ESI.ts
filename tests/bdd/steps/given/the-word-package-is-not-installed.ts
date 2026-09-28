import { Given } from '../../support/steps';
import { uninstallPeer } from '../../support/sdeFiles';

// The peers the ./sde entry point loads on first use.
Given('the {word} package is not installed', function (peer: string) {
  if (peer !== 'js-yaml' && peer !== 'adm-zip') {
    throw new Error(`${peer} is not an optional peer of ./sde`);
  }
  uninstallPeer(this, peer);
});
