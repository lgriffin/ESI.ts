import { Then } from '../../support/steps';

Then(
  'the parsed file {string} shall hold {int} records',
  function (name: string, count: number) {
    const parsed: Array<{ filename: string; records: Map<unknown, unknown> }> =
      this.result;
    const file = parsed.find((entry) => entry.filename === name);
    expect(file).toBeDefined();
    expect(file!.records.size).toBe(count);
  },
);
