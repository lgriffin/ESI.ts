import { Then } from '../../support/steps';
import { fileSize } from '../../support/sdeFiles';

Then('the downloaded file shall hold {int} bytes', function (bytes: number) {
  expect(fileSize(this.result)).toBe(bytes);
});
