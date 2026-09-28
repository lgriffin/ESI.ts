import { groupOf } from './chain';

export function open(world: any): void {
  world.sde = {};
}

export const walkChain = (provider: any) => {
  const type = provider.getType(1);
  return { type, group: groupOf(provider) };
};

/** Never called by a step, so getVersion stays uncovered. */
export function versionOf(provider: any): unknown {
  return provider.getVersion();
}
