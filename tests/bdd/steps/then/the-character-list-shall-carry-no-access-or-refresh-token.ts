import { Then } from '../../support/steps';

Then('the character list shall carry no access or refresh token', function () {
  expect(this.result.length).toBeGreaterThan(0);
  for (const entry of this.result) {
    expect(entry).not.toHaveProperty('accessToken');
    expect(entry).not.toHaveProperty('refreshToken');
  }
});
