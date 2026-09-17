/**
 * The replay tier's checks, each shown failing on a crafted input: coverage,
 * the shrink-only lists, truncation and the nightly shape diff. A check never
 * seen to fail has not been shown to work.
 */
import { coverageProblems } from '../recorded/coverage';
import {
  RecordedFixture,
  keepHeaders,
  keyPaths,
  templatePattern,
  truncateBody,
} from '../recorded/fixture';
import { ARRAY_HEAD, ARRAY_MAX, STRING_MAX } from '../recorded/policy';
import { shrinkOnlyProblems } from '../recorded/ratchet';
import { diffShapes, fixtureShape } from '../recorded/shape';

describe('coverageProblems', () => {
  const base = {
    publicEndpoints: ['a.one', 'a.two'],
    fixtures: ['a.one'],
    unrecordable: { 'a.two': 'reason' },
    knownMismatches: {},
  };

  it('passes when every endpoint has a fixture or a listed reason', () => {
    expect(coverageProblems(base)).toEqual([]);
  });

  it('reports a public endpoint with neither', () => {
    expect(coverageProblems({ ...base, unrecordable: {} })).toEqual([
      expect.stringContaining(
        'a.two: public GET endpoint with no recorded fixture',
      ),
    ]);
  });

  it('reports a listed endpoint that has a fixture', () => {
    expect(coverageProblems({ ...base, fixtures: ['a.one', 'a.two'] })).toEqual(
      [expect.stringContaining('a.two: has a fixture but is still listed')],
    );
  });

  it('reports list entries and fixtures for endpoints that no longer exist', () => {
    const problems = coverageProblems({
      ...base,
      fixtures: ['a.one', 'gone.fixture'],
      unrecordable: { 'a.two': 'reason', 'gone.entry': 'reason' },
      knownMismatches: { 'gone.mismatch': 'reason' },
    });
    expect(problems).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'gone.fixture: fixture for an endpoint that is not',
        ),
        expect.stringContaining(
          'gone.entry: unrecordable.json entry names no public GET endpoint',
        ),
        expect.stringContaining(
          'gone.mismatch: known-mismatches.json entry has no fixture',
        ),
      ]),
    );
  });
});

describe('shrinkOnlyProblems', () => {
  const current = { 'a.one': 'reason' };

  it('passes when the list shrank or stayed the same', () => {
    expect(
      shrinkOnlyProblems('list', current, {
        ref: 'origin/master',
        list: { 'a.one': 'reason', 'a.two': 'reason' },
      }),
    ).toEqual([]);
  });

  it('fails an entry the base branch does not have', () => {
    expect(
      shrinkOnlyProblems('list', current, { ref: 'origin/master', list: {} }),
    ).toEqual([expect.stringContaining("'a.one' is not on origin/master")]);
  });

  it('fails closed when no base ref can be read', () => {
    expect(
      shrinkOnlyProblems('list', current, { ref: null, list: null }),
    ).toEqual([expect.stringContaining('no base ref could be read')]);
  });

  it('allows the list on the branch that introduces the file', () => {
    expect(
      shrinkOnlyProblems('list', current, { ref: 'origin/master', list: null }),
    ).toEqual([]);
  });
});

describe('truncateBody', () => {
  it('leaves a small body alone', () => {
    expect(truncateBody({ a: [1, 2, 3] }, 1)).toEqual({
      body: { a: [1, 2, 3] },
      truncated: [],
    });
  });

  it('keeps the head of a long array plus elements with keys the head lacks, and records the cut', () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    rows[40] = { id: 40, rare: true } as { id: number };
    const { body, truncated } = truncateBody(rows, 2);
    expect(body).toEqual([
      { id: 0 },
      { id: 1 },
      { id: 2 },
      { id: 40, rare: true },
    ]);
    expect(truncated).toEqual([
      { page: 2, at: '$', kind: 'array', original: 50, kept: ARRAY_HEAD + 1 },
    ]);
  });

  it('never keeps more than ARRAY_MAX elements', () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({ [`k${i}`]: i }));
    expect((truncateBody(rows, 1).body as unknown[]).length).toBe(ARRAY_MAX);
  });

  it('cuts maps and long strings', () => {
    const map = Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => [`k${i}`, i]),
    );
    const { body, truncated } = truncateBody(
      { map, text: 'x'.repeat(STRING_MAX + 5) },
      1,
    );
    expect(Object.keys((body as { map: object }).map)).toHaveLength(4);
    expect((body as { text: string }).text).toHaveLength(STRING_MAX);
    expect(truncated.map((t) => `${t.kind}@${t.at}`)).toEqual([
      'map@$.map',
      'string@$.text',
    ]);
  });
});

describe('fixture helpers', () => {
  it('keeps only the cache, pagination and content headers', () => {
    expect(
      keepHeaders([
        ['ETag', '"x"'],
        ['X-Pages', '3'],
        ['X-Esi-Request-Id', 'abc'],
        ['Date', 'today'],
      ]),
    ).toEqual({ etag: '"x"', 'x-pages': '3' });
  });

  it('collects key paths with array indices collapsed', () => {
    expect([...keyPaths([{ a: { b: 1 } }, { c: [{ d: 2 }] }])].sort()).toEqual([
      '$[].a',
      '$[].a.b',
      '$[].c',
      '$[].c[].d',
    ]);
  });

  it('matches the paths a template produces, and nothing else', () => {
    const pattern = templatePattern('markets/{regionId}/orders/');
    expect(pattern.test('markets/10000002/orders/?order_type=all')).toBe(true);
    expect(pattern.test('markets/10000002/history/?type_id=34')).toBe(false);
  });
});

describe('diffShapes', () => {
  const fixture = (
    body: unknown,
    headers: Record<string, string> = { etag: '"1"' },
  ): RecordedFixture => ({
    endpoint: 'x.y',
    call: { client: 'x', method: 'y', args: [] },
    recordedAt: '2026-01-01',
    compatibilityDate: '2026-05-19',
    specHash: 'sha256:0',
    specCacheSeconds: 60,
    upstreamPages: 1,
    truncated: [],
    pages: [{ url: 'y', status: 200, headers, body }],
  });
  const diff = (a: RecordedFixture, b: RecordedFixture) =>
    diffShapes(fixtureShape(a), fixtureShape(b));

  it('ignores changed values of the same type', () => {
    expect(
      diff(
        fixture([{ price: 1.5, name: 'a' }], { etag: '"1"' }),
        fixture(
          [
            { price: 9, name: 'b' },
            { price: 2, name: 'c' },
          ],
          { etag: '"2"' },
        ),
      ),
    ).toEqual([]);
  });

  it('reports a type change, a new null, and added or removed fields', () => {
    expect(
      diff(
        fixture({ a: 1, b: 'x', gone: true }),
        fixture({ a: '1', b: null, added: 2 }),
      ),
    ).toEqual([
      '$[].a type number -> string',
      '$[].added added (number)',
      '$[].b type string -> null',
      '$[].gone removed (was boolean)',
    ]);
  });

  it('reports a cache header appearing or disappearing', () => {
    expect(
      diff(fixture({}, { etag: '"1"' }), fixture({}, { expires: 'soon' })),
    ).toEqual(['header etag no longer sent', 'header expires now sent']);
  });

  it('does not report element fields under an array that is empty today', () => {
    expect(diff(fixture({ rows: [{ id: 1 }] }), fixture({ rows: [] }))).toEqual(
      [],
    );
  });
});
