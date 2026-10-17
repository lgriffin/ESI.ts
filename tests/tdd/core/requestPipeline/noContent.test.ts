import {
  answeredWithNoContent,
  emptyListWhenNoContent,
} from '../../../../src/core/requestPipeline/statusHandling';

// One reading of ESI's no-content answer for both surfaces: the custom
// clients (EndpointDefinition.emptyWhenNoContent) and the generated
// operations (OperationMeta.emptyWhenNoContent).
describe('requestPipeline no-content answers (ARCH-08: shared by both surfaces)', () => {
  const response = (status: number, headers: Record<string, string> = {}) =>
    new Response(status === 204 ? null : '', { status, headers });

  describe('answeredWithNoContent', () => {
    it('is true for a 204', () => {
      expect(answeredWithNoContent(response(204))).toBe(true);
    });

    it('is true for a 200 with Content-Length 0', () => {
      expect(
        answeredWithNoContent(response(200, { 'content-length': '0' })),
      ).toBe(true);
    });

    it('is false for a 200 without Content-Length 0', () => {
      expect(answeredWithNoContent(response(200))).toBe(false);
      expect(
        answeredWithNoContent(response(200, { 'content-length': '12' })),
      ).toBe(false);
    });

    it('is false for any other status with Content-Length 0', () => {
      expect(
        answeredWithNoContent(response(201, { 'content-length': '0' })),
      ).toBe(false);
    });
  });

  describe('emptyListWhenNoContent', () => {
    it('reads no body as an empty list on a route flagged emptyWhenNoContent', () => {
      expect(emptyListWhenNoContent(undefined, true)).toEqual([]);
    });

    it('leaves no body alone on any other route', () => {
      expect(emptyListWhenNoContent(undefined, false)).toBeUndefined();
      expect(emptyListWhenNoContent(undefined, undefined)).toBeUndefined();
    });

    it('returns a body that arrived unchanged', () => {
      const body = [{ bid_id: 1 }];
      expect(emptyListWhenNoContent(body, true)).toBe(body);
    });
  });
});
