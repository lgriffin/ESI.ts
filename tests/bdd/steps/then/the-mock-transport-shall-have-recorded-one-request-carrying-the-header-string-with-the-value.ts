import { transportOf } from '../../support/mock-transport';
import { Then } from '../../support/steps';

Then(
  'the mock transport shall have recorded one request carrying the header {string} with the value {string}',
  function (name: string, value: string) {
    const { sent } = transportOf(this);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.headers[name]).toBe(value);
  },
);
