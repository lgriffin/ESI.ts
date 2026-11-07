import { DEFAULT_SSO_JWKS_URL } from '../../../../src/auth/jwks';
import { Then } from '../../support/steps';

Then('the number of key set fetches shall be {int}', function (count: number) {
  const requests = this.values.verification.requests;
  expect(requests.map((r: { url: string }) => r.url)).toEqual(
    Array.from({ length: count }, () => DEFAULT_SSO_JWKS_URL),
  );
});
