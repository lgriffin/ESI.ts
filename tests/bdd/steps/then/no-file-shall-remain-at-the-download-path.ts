import * as fs from 'node:fs';
import { Then } from '../../support/steps';

Then('no file shall remain at the download path', function () {
  expect(fs.existsSync(this.values.downloadPath as string)).toBe(false);
});
