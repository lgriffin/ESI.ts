import type { IStaticDataProvider } from '../../../src/sde/IStaticDataProvider';

export function groupOf(provider: IStaticDataProvider): unknown {
  return provider.getGroup(2);
}
