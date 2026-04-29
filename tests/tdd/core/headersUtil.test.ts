import { parseHeaders, parseWarning } from '../../../src/core/util/headersUtil';

function makeHeaders(entries: Record<string, string>): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(entries)) {
    h.set(k, v);
  }
  return h;
}

describe('parseWarning', () => {
  it('parses a 199 upgrade notice', () => {
    const w = parseWarning('199 - "This route has an upgrade available"');
    expect(w).toEqual({
      code: 199,
      message: 'This route has an upgrade available',
    });
  });

  it('parses a 299 deprecation warning', () => {
    const w = parseWarning('299 - "This route is deprecated"');
    expect(w).toEqual({ code: 299, message: 'This route is deprecated' });
  });

  it('handles unquoted warning messages', () => {
    const w = parseWarning('199 - This route has an upgrade available');
    expect(w).toEqual({
      code: 199,
      message: 'This route has an upgrade available',
    });
  });

  it('returns null for null/undefined/empty input', () => {
    expect(parseWarning(null)).toBeNull();
    expect(parseWarning(undefined)).toBeNull();
    expect(parseWarning('')).toBeNull();
  });

  it('returns null for malformed warnings', () => {
    expect(parseWarning('not a warning')).toBeNull();
    expect(parseWarning('abc - "message"')).toBeNull();
    expect(parseWarning('199')).toBeNull();
  });
});

describe('parseHeaders', () => {
  it('extracts warning header', () => {
    const h = makeHeaders({
      warning: '299 - "This route is deprecated"',
    });
    const parsed = parseHeaders(h);
    expect(parsed.warning).toEqual({
      code: 299,
      message: 'This route is deprecated',
    });
  });

  it('sets warning to null when absent', () => {
    const parsed = parseHeaders(makeHeaders({}));
    expect(parsed.warning).toBeNull();
  });

  it('extracts x-esi-request-id', () => {
    const parsed = parseHeaders(
      makeHeaders({ 'x-esi-request-id': 'abc-123-def' }),
    );
    expect(parsed.requestId).toBe('abc-123-def');
  });

  it('sets requestId to null when absent', () => {
    const parsed = parseHeaders(makeHeaders({}));
    expect(parsed.requestId).toBeNull();
  });

  it('extracts date header', () => {
    const parsed = parseHeaders(
      makeHeaders({ date: 'Tue, 29 Apr 2026 12:00:00 GMT' }),
    );
    expect(parsed.date).toBe('Tue, 29 Apr 2026 12:00:00 GMT');
  });

  it('sets date to null when absent', () => {
    const parsed = parseHeaders(makeHeaders({}));
    expect(parsed.date).toBeNull();
  });

  it('extracts content-language header', () => {
    const parsed = parseHeaders(makeHeaders({ 'content-language': 'en-us' }));
    expect(parsed.contentLanguage).toBe('en-us');
  });

  it('sets contentLanguage to null when absent', () => {
    const parsed = parseHeaders(makeHeaders({}));
    expect(parsed.contentLanguage).toBeNull();
  });

  it('preserves existing pagination and etag fields', () => {
    const h = makeHeaders({
      'x-pages': '5',
      etag: '"abc123"',
      'cache-control': 'public, max-age=300',
      expires: 'Tue, 29 Apr 2026 13:00:00 GMT',
      'last-modified': 'Tue, 29 Apr 2026 11:00:00 GMT',
    });
    const parsed = parseHeaders(h);
    expect(parsed.xPages).toBe(5);
    expect(parsed.etag).toBe('"abc123"');
    expect(parsed.cacheControl).toBe('public, max-age=300');
    expect(parsed.expires).toBe('Tue, 29 Apr 2026 13:00:00 GMT');
    expect(parsed.lastModified).toBe('Tue, 29 Apr 2026 11:00:00 GMT');
  });

  it('detects cursor pagination headers', () => {
    const h = makeHeaders({
      'x-cursor-before': 'token-before',
      'x-cursor-after': 'token-after',
    });
    const parsed = parseHeaders(h);
    expect(parsed.hasCursorPagination).toBe(true);
    expect(parsed.cursorBefore).toBe('token-before');
    expect(parsed.cursorAfter).toBe('token-after');
  });

  it('lowercases all header keys in raw map', () => {
    const h = makeHeaders({ 'X-ESI-Request-ID': 'req-456' });
    const parsed = parseHeaders(h);
    expect(parsed.raw['x-esi-request-id']).toBe('req-456');
    expect(parsed.requestId).toBe('req-456');
  });
});
