import { headerOf } from '../../support/request-headers';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  "the request shall carry the character's stored access token as the bearer",
  function () {
    expect(this.error).toBeUndefined();
    expect(headerOf(lastRequest().headers, 'Authorization')).toBe(
      `Bearer ${this.values.storedToken}`,
    );
  },
);
