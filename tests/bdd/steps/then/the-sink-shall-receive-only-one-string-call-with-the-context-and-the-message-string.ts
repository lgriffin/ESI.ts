import { Then } from '../../support/steps';

Then(
  'the sink shall receive only one {string} call with the context and the message {string}:',
  function (method: string, message: string, context: string) {
    expect(this.values.sink.calls).toEqual([
      { method, args: [JSON.parse(context), message] },
    ]);
  },
);
