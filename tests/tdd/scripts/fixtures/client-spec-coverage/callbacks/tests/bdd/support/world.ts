import type { DeltaClient } from '../../../src/clients/DeltaClient';

export class World {
  delta!: DeltaClient;
  action: (() => unknown) | undefined;
  result: unknown;
}
