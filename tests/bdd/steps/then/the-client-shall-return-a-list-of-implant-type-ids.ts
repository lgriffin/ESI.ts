import { CLONE_CHARACTER_ID, clonePaths } from '../../support/clones';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return a list of implant type IDs', function () {
  expect(lastRequest().url.pathname).toBe(
    clonePaths.implants(CLONE_CHARACTER_ID),
  );
  expect(this.result).toEqual([9899, 9941, 9942, 9943, 9956]);
});
