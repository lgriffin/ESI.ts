import { Then } from '../../support/steps';

Then(
  'the last progress report shall be {int} of {int} bytes',
  function (downloaded: number, total: number) {
    const progress: Array<[number, number]> = this.values.progress;
    expect(progress.at(-1)).toEqual([downloaded, total]);
  },
);
