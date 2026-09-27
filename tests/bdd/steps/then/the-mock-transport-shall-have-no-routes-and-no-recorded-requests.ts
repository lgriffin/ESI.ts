import { transportOf } from '../../support/mock-transport';
import { Then } from '../../support/steps';

Then(
  'the mock transport shall have no routes and no recorded requests',
  function () {
    const transport = transportOf(this);
    expect(transport.routes).toHaveLength(0);
    expect(transport.sent).toHaveLength(0);
    expect(transport.unrouted).toHaveLength(0);
  },
);
