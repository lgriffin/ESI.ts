import * as base from './BaseEsiClient';

/** Extends BaseEsiClient through a namespace import: still a domain client. */
export class EpsilonClient extends base.BaseEsiClient {
  getEpsilon(): number {
    return 1;
  }
}
