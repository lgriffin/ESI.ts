import { transportOf } from '../../support/mock-transport';
import { Then } from '../../support/steps';

Then(
  'the mock transport shall list the request {string} as unrouted',
  function (request: string) {
    expect(transportOf(this).unrouted).toEqual([request]);
  },
);
