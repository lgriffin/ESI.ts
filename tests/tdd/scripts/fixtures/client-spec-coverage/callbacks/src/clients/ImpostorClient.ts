import { BaseEsiClient } from '../other/BaseEsiClient';

/** Extends a same-named class from elsewhere: not a domain client. */
export class ImpostorClient extends BaseEsiClient {
  getImpostor(): number {
    return 1;
  }
}
