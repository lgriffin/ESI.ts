import { Then } from '../../support/steps';

Then('the URL shall carry the query parameters:', function (expected: string) {
  const url = this.result as URL;
  const params = JSON.parse(expected) as Record<string, string>;
  for (const [name, value] of Object.entries(params)) {
    expect([name, url.searchParams.get(name)]).toEqual([name, value]);
  }
});
