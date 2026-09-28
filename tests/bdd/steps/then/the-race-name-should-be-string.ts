import type { Race } from '../../../../src/sde/domain/types';
import { Then } from '../../support/steps';

Then('the race name should be {string}', function (name: string) {
  const race: Race | null = this.result;
  expect(race).not.toBeNull();
  expect(race!.name).toBe(name);
});
