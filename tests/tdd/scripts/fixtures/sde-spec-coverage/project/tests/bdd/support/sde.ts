import type { IStaticDataProvider } from '../../../src/sde/ports/IStaticDataProvider';
import { groupOf } from './chain';
import type { World } from './world';

export function open(world: World): void {
  world.sde = {} as IStaticDataProvider;
}

export const walkChain = (provider: IStaticDataProvider) => {
  const type = provider.getType(1);
  return { type, group: groupOf(provider), category: categoryOf(provider) };
};

/** Declared beside its caller, not imported: still followed. */
function categoryOf(provider: IStaticDataProvider): unknown {
  return provider.getCategory(3);
}

/** Never called by a step, so getVersion stays uncovered. */
export function versionOf(provider: IStaticDataProvider): unknown {
  return provider.getVersion();
}
