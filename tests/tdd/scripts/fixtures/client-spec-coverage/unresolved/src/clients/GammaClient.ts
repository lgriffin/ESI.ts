import { BaseEsiClient } from './BaseEsiClient';

export class GammaClient extends BaseEsiClient {
  getGamma(): number {
    return 1;
  }
}
