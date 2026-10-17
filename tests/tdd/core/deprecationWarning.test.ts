import { ApiClient } from '../../../src/core/ApiClient';
import {
  deprecationWarning,
  warnIfDeprecated,
} from '../../../src/core/endpoints/deprecationWarning';
import { logCalls, spyLogger } from '../helpers/spyLogger';

// One wording for both surfaces: the custom clients (createClient, from an
// endpoint's DeprecationInfo) and the generated operations
// (PipelineTransport, from OperationMeta.deprecation).
describe('deprecationWarning (ARCH-08: one warning for both surfaces)', () => {
  it('names an endpoint and every piece of guidance, in order', () => {
    expect(
      deprecationWarning('Endpoint', 'getStatus', {
        message: 'Read the route status instead.',
        replacedBy: 'getRouteStatus',
        sunsetDate: '2027-01-01',
      }),
    ).toBe(
      "Endpoint 'getStatus' is deprecated. Read the route status instead. Use 'getRouteStatus' instead. Sunset date: 2027-01-01.",
    );
  });

  it('names an operation the same way', () => {
    expect(
      deprecationWarning('Operation', 'GetStatus', {
        replacedBy: 'GetMetaStatus',
      }),
    ).toBe("Operation 'GetStatus' is deprecated. Use 'GetMetaStatus' instead.");
  });

  it('says only that the route is deprecated when there is no guidance', () => {
    expect(deprecationWarning('Operation', 'GetStatus', {})).toBe(
      "Operation 'GetStatus' is deprecated.",
    );
  });

  it('leaves out empty guidance fields', () => {
    expect(
      deprecationWarning('Endpoint', 'getStatus', {
        message: '',
        replacedBy: '',
        sunsetDate: '2027-01-01',
      }),
    ).toBe("Endpoint 'getStatus' is deprecated. Sunset date: 2027-01-01.");
  });
});

describe('warnIfDeprecated', () => {
  function clientWithLogger() {
    const logger = spyLogger();
    const client = new ApiClient('test', 'https://esi.evetech.net');
    client.setLogger(logger);
    return { client, logger };
  }

  it('logs the warning at warn level with the given context', () => {
    const { client, logger } = clientWithLogger();
    warnIfDeprecated(
      client,
      'Endpoint',
      'getStatus',
      { sunsetDate: '2027-01-01' },
      { endpoint: 'getStatus' },
    );
    expect(logCalls(logger)).toEqual([
      [
        'warn',
        "Endpoint 'getStatus' is deprecated. Sunset date: 2027-01-01.",
        { endpoint: 'getStatus' },
      ],
    ]);
  });

  it('logs nothing when there is no deprecation', () => {
    const { client, logger } = clientWithLogger();
    warnIfDeprecated(client, 'Operation', 'GetStatus', undefined, {
      operationId: 'GetStatus',
    });
    expect(logCalls(logger)).toEqual([]);
  });
});
