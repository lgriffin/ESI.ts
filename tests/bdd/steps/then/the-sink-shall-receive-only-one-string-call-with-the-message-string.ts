import { Then } from '../../support/steps';

Then(
  'the sink shall receive only one {string} call with the message {string}',
  function (method: string, message: string) {
    expect(this.values.sink.calls).toEqual([{ method, args: [message] }]);
  },
);
