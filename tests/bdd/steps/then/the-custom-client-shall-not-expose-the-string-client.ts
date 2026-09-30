import type { ApiClientType } from '../../../../src/EsiClientBuilder';
import { customClientOf } from '../../support/custom-client';
import { Then } from '../../support/steps';

Then(
  'the custom client shall not expose the {string} client',
  function (name: string) {
    const custom = customClientOf(this);
    expect(custom.hasClient(name as ApiClientType)).toBe(false);
    expect(
      (custom as unknown as Record<string, unknown>)[name],
    ).toBeUndefined();
  },
);
