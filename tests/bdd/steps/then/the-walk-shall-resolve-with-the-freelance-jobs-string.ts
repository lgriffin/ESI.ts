import { Then } from '../../support/steps';

Then(
  'the walk shall resolve with the freelance jobs {string}',
  function (ids: string) {
    expect(this.error).toBeUndefined();
    expect(this.result).toEqual(ids.split(', ').map((id) => ({ id })));
  },
);
