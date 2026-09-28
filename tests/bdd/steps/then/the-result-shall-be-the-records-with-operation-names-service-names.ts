import { Then } from '../../support/steps';

// Station operations and services carry their name in a field of their own.
// Membership and count, not order: neither provider sorts a table it reads whole.
Then(
  /^the result shall be the records with (operation names|service names) "([^"]*)"$/,
  function (kind: string, names: string) {
    const field = kind === 'operation names' ? 'operationName' : 'serviceName';
    const records: Array<Record<string, string>> = this.result;
    expect(records.map((r) => r[field]).sort()).toEqual(
      names.split(', ').sort(),
    );
  },
);
