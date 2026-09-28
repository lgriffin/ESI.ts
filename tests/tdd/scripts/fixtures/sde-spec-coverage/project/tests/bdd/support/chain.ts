import type { IStaticDataProvider } from '../../../src/sde/ports/IStaticDataProvider';

export function groupOf(provider: IStaticDataProvider): unknown {
  return provider.getGroup(2);
}
