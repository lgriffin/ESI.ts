import { Then } from '../../support/steps';

// A text field of the returned record, named for the reader.
Then(
  /^the returned record shall carry the (ticker|internal name|display name|icon file|graphic file|operation name|service name) "([^"]*)"$/,
  function (field: string, value: string) {
    const fields: Record<string, string> = {
      ticker: 'tickerName',
      'internal name': 'internalName',
      'display name': 'displayName',
      'icon file': 'iconFile',
      'graphic file': 'graphicFile',
      'operation name': 'operationName',
      'service name': 'serviceName',
    };
    expect(this.result).not.toBeNull();
    expect(this.result[fields[field]!]).toBe(value);
  },
);
