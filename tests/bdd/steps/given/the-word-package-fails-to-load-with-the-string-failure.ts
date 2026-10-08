import { Given } from '../../support/steps';
import {
  PEER_FAILURES,
  type PeerFailure,
  failPeer,
} from '../../support/sdeFiles';

// The peers the ./sde entry point loads on first use, and the ways
// PEER_FAILURES describes for one of them to fail.
Given(
  'the {word} package fails to load with the {string} failure',
  function (peer: string, failure: string) {
    if (peer !== 'js-yaml' && peer !== 'adm-zip') {
      throw new Error(`${peer} is not an optional peer of ./sde`);
    }
    if (!(failure in PEER_FAILURES)) {
      throw new Error(`${failure} is not a failure PEER_FAILURES describes`);
    }
    failPeer(this, peer, failure as PeerFailure);
  },
);
