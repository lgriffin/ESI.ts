import { Then } from '../../support/steps';
import { fileMatchesServedArchive } from '../../support/sdeFiles';

Then('the downloaded file shall hold the bytes that were served', function () {
  expect(fileMatchesServedArchive(this, this.result)).toBe(true);
});
