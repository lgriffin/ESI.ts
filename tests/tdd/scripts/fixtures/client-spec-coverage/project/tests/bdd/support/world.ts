import type { AlphaClient } from '../../../src/clients/AlphaClient';
import type { BetaClient } from '../../../src/clients/BetaClient';

export class World {
  alpha!: AlphaClient;
  beta!: BetaClient;
  result: unknown;
}
