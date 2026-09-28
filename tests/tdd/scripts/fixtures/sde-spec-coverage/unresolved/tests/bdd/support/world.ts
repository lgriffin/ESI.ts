import type { IStaticDataProvider } from '../../../src/sde/ports/IStaticDataProvider';

export class World {
  sde!: IStaticDataProvider;
  result: unknown;
}
