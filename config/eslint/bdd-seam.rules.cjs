/**
 * R3: BDD scenarios mock only at the transport seam (tests/bdd/support/transport.ts).
 *
 * Spying on, or reassigning, a method of an ESI client replaces the code the
 * scenario claims to verify, so the scenario can no longer fail for a bug in
 * src/. These selectors ban it anywhere under tests/bdd. Shared with the rule's
 * own test in tests/tdd/bdd-seam/.
 */
const CLIENT = '/client$/i';
const message =
  'Mock at the transport seam (queueResponse from tests/bdd/support/transport), not an ESI client method. See tests/bdd/README.md.';

module.exports = {
  'no-restricted-syntax': [
    'error',
    // jest.spyOn(client.market, 'getX') / spyOn(MarketClient.prototype, 'getX')
    {
      selector: `CallExpression[callee.property.name='spyOn'][arguments.0.object.name=${CLIENT}]`,
      message,
    },
    // jest.spyOn(world.client.market, 'getX') / jest.spyOn(this.client.market, 'getX')
    {
      selector: `CallExpression[callee.property.name='spyOn'][arguments.0.object.property.name=${CLIENT}]`,
      message,
    },
    // jest.spyOn(marketClient, 'getX') / jest.spyOn(apiClient, 'request')
    {
      selector: `CallExpression[callee.property.name='spyOn'][arguments.0.name=${CLIENT}]`,
      message,
    },
    // client.market.getX = jest.fn()
    {
      selector: `AssignmentExpression[left.object.object.name=${CLIENT}]`,
      message,
    },
    {
      selector: `AssignmentExpression[left.object.object.property.name=${CLIENT}]`,
      message,
    },
  ],
};
