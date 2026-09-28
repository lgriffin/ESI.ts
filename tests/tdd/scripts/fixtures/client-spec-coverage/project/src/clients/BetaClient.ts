import { BaseEsiClient } from './BaseEsiClient';

export class BetaClient extends BaseEsiClient {
  getShared(): number {
    return 1;
  }

  getAmbiguous(): number {
    return 2;
  }

  getQualified(): number {
    return 3;
  }

  getLegacy(): number {
    return 4;
  }

  getLooped(): number {
    return 5;
  }

  getOnlyInHook(): number {
    return 6;
  }
}
