import { transportOf } from '../../support/mock-transport';
import { Then } from '../../support/steps';

Then(
  'the recorded request shall carry the body {string}',
  function (body: string) {
    expect(this.error).toBeUndefined();
    const { sent } = transportOf(this);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.method).toBe('POST');
    expect(sent[0]!.body).toBe(body);
  },
);
