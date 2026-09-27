import { headerOf } from '../../support/request-headers';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  "the request shall carry the character's fresh access token as the bearer",
  function () {
    expect(this.error).toBeUndefined();
    expect(this.values.freshToken).not.toBe(this.values.storedToken);
    expect(headerOf(lastRequest().headers, 'Authorization')).toBe(
      `Bearer ${this.values.freshToken}`,
    );
  },
);
