import { Given } from '../../support/steps';

Given(
  'the token refresh fails with the error {string}',
  function (message: string) {
    this.values.refresh = (): Promise<void> => {
      this.values.refreshes += 1;
      return Promise.reject(new Error(message));
    };
  },
);
