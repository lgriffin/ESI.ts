import { Then } from '../../support/steps';

Then(
  'the response metadata shall carry the ETag {string}, the header {string} set to {string} and the request id {string}',
  function (etag: string, header: string, value: string, requestId: string) {
    const headers = this.result.meta.headers as Record<string, string>;
    expect(headers['etag']).toBe(`"${etag}"`);
    expect(headers[header]).toBe(value);
    expect(headers['x-esi-request-id']).toBe(requestId);
  },
);
