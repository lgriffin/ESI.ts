import { Then } from '../../support/steps';

Then(
  'the star should have spectral class {string}',
  function (spectralClass: string) {
    expect(this.result.statistics.spectralClass).toBe(spectralClass);
  },
);
