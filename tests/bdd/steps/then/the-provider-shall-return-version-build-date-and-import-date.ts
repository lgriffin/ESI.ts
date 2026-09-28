import { type SdeVersionInfo } from '../../../../src/sde/version';
import { HIERARCHICAL_VERSION } from '../../support/sde';
import { Then } from '../../support/steps';

Then(
  'the provider shall return version, build date, and import date',
  function () {
    const version: SdeVersionInfo = this.result;
    expect(version).toEqual(HIERARCHICAL_VERSION);
  },
);
