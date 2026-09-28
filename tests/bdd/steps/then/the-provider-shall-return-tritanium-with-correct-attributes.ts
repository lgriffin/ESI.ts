import { TRITANIUM } from '../../support/sde';
import { Then } from '../../support/steps';

Then(
  'the provider shall return Tritanium with correct attributes',
  function () {
    expect(this.result).not.toBeNull();
    expect(this.result.typeId).toBe(TRITANIUM.typeId);
    expect(this.result.name).toBe(TRITANIUM.name);
    expect(this.result.groupId).toBe(TRITANIUM.groupId);
    expect(this.result.published).toBe(true);
  },
);
