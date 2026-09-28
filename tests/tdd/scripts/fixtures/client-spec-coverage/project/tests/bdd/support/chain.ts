import type { AlphaClient } from '../../../src/clients/AlphaClient';

export function chainedOf(alpha: AlphaClient): number {
  return alpha.getChained(1);
}
