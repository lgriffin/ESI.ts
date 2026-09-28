import type { AlphaClient } from '../../../src/clients/AlphaClient';
import type { BetaClient } from '../../../src/clients/BetaClient';
import { chainedOf } from './chain';

export const walk = (alpha: AlphaClient) => chainedOf(alpha);

/** Never called by a step, so BetaClient.getShared stays uncovered. */
export function unused(beta: BetaClient): number {
  return beta.getShared();
}
