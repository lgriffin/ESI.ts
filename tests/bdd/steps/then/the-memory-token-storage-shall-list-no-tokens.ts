import { Then } from '../../support/steps';

Then('the memory token storage shall list no tokens', async function () {
  expect(await this.values.memoryStorage.list()).toEqual([]);
});
