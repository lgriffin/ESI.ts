import type { DogmaAttribute } from '../../../../src/sde/domain/types';
import { Then } from '../../support/steps';

Then('the attribute name should be {string}', function (name: string) {
  const attribute: DogmaAttribute | null = this.result;
  expect(attribute).not.toBeNull();
  expect(attribute!.name).toBe(name);
});
