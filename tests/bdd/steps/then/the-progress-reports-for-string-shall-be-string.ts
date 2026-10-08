import { Then } from '../../support/steps';

// Reports for one table, in order, each "inserted of total".
Then(
  'the progress reports for {string} shall be {string}',
  function (table: string, reports: string) {
    const progress: Array<[string, number, number]> = this.values.progress;
    expect(
      progress
        .filter(([name]) => name === table)
        .map(([, inserted, total]) => `${inserted} of ${total}`),
    ).toEqual(reports.split(', '));
  },
);
