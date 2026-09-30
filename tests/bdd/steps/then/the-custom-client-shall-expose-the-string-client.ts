import type { ApiClientType } from '../../../../src/EsiClientBuilder';
import { customClientOf } from '../../support/custom-client';
import { Then } from '../../support/steps';

Then(
  'the custom client shall expose the {string} client',
  function (name: string) {
    const custom = customClientOf(this);
    expect(custom.hasClient(name as ApiClientType)).toBe(true);
    expect(custom.getClient(name as ApiClientType)).toBeDefined();
    expect((custom as unknown as Record<string, unknown>)[name]).toBe(
      custom.getClient(name as ApiClientType),
    );
  },
);
