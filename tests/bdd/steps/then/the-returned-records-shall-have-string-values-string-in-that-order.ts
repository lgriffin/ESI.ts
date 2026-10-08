import { Then } from '../../support/steps';

// The collection under `this.result`, read as `field` of each record, is
// exactly the comma-separated `values`, in that order.
Then(
  'the returned records shall have {string} values {string} in that order',
  function (field: string, values: string) {
    const records = this.result as Array<Record<string, unknown>>;
    expect(records.map((record) => String(record[field]))).toEqual(
      values.split(',').map((value) => value.trim()),
    );
  },
);
