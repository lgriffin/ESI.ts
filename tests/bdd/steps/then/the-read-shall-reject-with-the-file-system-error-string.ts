import { Then } from '../../support/steps';

Then(
  'the read shall reject with the file system error {string}',
  function (code: string) {
    expect((this.error as NodeJS.ErrnoException).code).toBe(code);
  },
);
