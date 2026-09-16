import { CLONE_CHARACTER_ID, clonePaths } from '../../support/clones';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall have complete clone data', function () {
  const { clones, implants } = this.result;
  expect(sentRequests().map((r) => r.url.pathname)).toEqual([
    clonePaths.clones(CLONE_CHARACTER_ID),
    clonePaths.implants(CLONE_CHARACTER_ID),
  ]);
  expect(clones.jump_clones.map((c: any) => c.implants)).toEqual([
    [9899, 9941],
    [9942],
  ]);
  expect(implants).toEqual([9943, 9956]);
});
