import { readFileSync } from 'fs';
import * as path from 'path';
import { z } from 'zod';
import {
  BaseBaseline,
  DriftBaseline,
  EndpointSchemaMapping,
  EXIT_DRIFT,
  EXIT_INTEGRITY,
  OpenApiSpec,
  SchemaDriftReport,
  applyBaseline,
  buildDriftReport,
  exitCodeFor,
  findingKey,
  integrityProblems,
  mappingsFromEndpointModules,
  parseBaseline,
  pathShape,
  ratchetProblems,
  serializeBaseline,
} from '../../../scripts/schema-drift-core';
import {
  ProjectSchema,
  StatusSchema,
  tinyEndpoints,
} from './fixtures/tinyEndpoints';

const tinySpec = JSON.parse(
  readFileSync(path.join(__dirname, 'fixtures', 'tiny-spec.json'), 'utf-8'),
) as OpenApiSpec;

const schemaNames = new Map<unknown, string>([
  [ProjectSchema, 'ProjectSchema'],
  [StatusSchema, 'StatusSchema'],
]);

/** The mappings the CLI builds from the fixture endpoint map. */
function tinyMappings(): EndpointSchemaMapping[] {
  return mappingsFromEndpointModules(
    { 'tinyEndpoints.ts': { tinyEndpoints } },
    schemaNames,
  );
}

describe('schema drift report', () => {
  describe('when a definition path is written the way src/core/endpoints writes it', () => {
    it('reports a required field the spec does not define', () => {
      const report = buildDriftReport(tinySpec, tinyMappings());

      expect(report.findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            endpoint: 'tinyEndpoints.getCorporationProjects',
            specPath: '/corporations/{corporation_id}/projects',
            field: '[].station_id',
            kind: 'required_not_in_spec',
          }),
          expect.objectContaining({
            endpoint: 'tinyEndpoints.getCorporationProject',
            specPath: '/corporations/{corporation_id}/projects/{project_id}',
            field: 'station_id',
            kind: 'required_not_in_spec',
          }),
        ]),
      );
    });

    it('compares every mapping that has a spec operation', () => {
      const report = buildDriftReport(tinySpec, tinyMappings());

      expect(report).toMatchObject({
        mappings: 3,
        matched: 3,
        compared: 3,
        unmatched: [],
      });
    });

    it('reports a nested field the schema requires but the spec marks optional', () => {
      const report = buildDriftReport(tinySpec, tinyMappings());

      expect(report.findings).toContainEqual(
        expect.objectContaining({
          endpoint: 'tinyEndpoints.getCorporationProject',
          field: 'progress.desired',
          kind: 'required_but_optional_in_spec',
        }),
      );
    });

    it('reports nothing for a schema that agrees with the spec', () => {
      const report = buildDriftReport(tinySpec, tinyMappings());

      expect(
        report.findings.filter((f) => f.endpoint === 'tinyEndpoints.getStatus'),
      ).toEqual([]);
    });
  });

  describe('when the report compared nothing', () => {
    const noOp: SchemaDriftReport = buildDriftReport(
      { paths: {} },
      tinyMappings(),
    );

    it('lists every mapping as unmatched', () => {
      expect(noOp.unmatched.map((u) => u.endpoint)).toEqual([
        'tinyEndpoints.getCorporationProjects',
        'tinyEndpoints.getCorporationProject',
        'tinyEndpoints.getStatus',
      ]);
    });

    it.each([true, false])('fails with --ci=%s', (ci) => {
      expect(exitCodeFor(noOp, { ci })).not.toBe(0);
    });
  });

  describe('when more than a small fraction of mappings resolve to no spec operation', () => {
    const mostlyUnmatched = buildDriftReport(tinySpec, [
      ...tinyMappings().slice(2),
      ...tinyMappings()
        .slice(0, 2)
        .map((m) => ({ ...m, path: `renamed/${m.path}` })),
    ]);

    it.each([true, false])('fails with --ci=%s', (ci) => {
      expect(mostlyUnmatched.compared).toBeGreaterThan(0);
      expect(exitCodeFor(mostlyUnmatched, { ci })).not.toBe(0);
    });
  });

  describe('path matching', () => {
    it.each([
      [
        'corporations/{corporationId}/projects',
        '/corporations/{corporation_id}/projects',
      ],
      [
        '/corporations/{corporationId}/projects/',
        '/corporations/{corporation_id}/projects',
      ],
      ['alliances/{allianceId}/', '/alliances/{alliance_id}'],
      ['status', '/status/'],
      ['//status//', '/status'],
      [
        'characters/{characterId}/mail/{mailId}',
        '/characters/{character_id}/mail/{mail_id}',
      ],
    ])('%s has the same shape as %s', (definition, specPath) => {
      expect(pathShape(definition)).toBe(pathShape(specPath));
    });

    it.each([
      [
        'characters/{characterId}/mail',
        '/characters/{character_id}/mail/labels',
      ],
      [
        'characters/{characterId}/mail/{mailId}',
        '/characters/{character_id}/mail/labels',
      ],
      ['Status', '/status'],
      ['fw/stats', '/fw/leaderboards'],
    ])('%s does not have the shape of %s', (definition, specPath) => {
      expect(pathShape(definition)).not.toBe(pathShape(specPath));
    });

    it('matches parameters by position, not by name', () => {
      const spec: OpenApiSpec = {
        paths: {
          '/a/{x}/b/{y}': { get: jsonBody({ type: 'object', properties: {} }) },
        },
      };
      const report = buildDriftReport(spec, [
        mapping({ path: 'a/{first}/b/{second}', schema: z.looseObject({}) }),
      ]);

      expect(report).toMatchObject({ matched: 1, compared: 1, unmatched: [] });
    });

    it('lists why a mapping matched nothing', () => {
      const report = buildDriftReport(
        {
          paths: {
            '/status': { get: jsonBody({ type: 'object' }) },
            '/twin/{a}': { get: jsonBody({ type: 'object' }) },
            '/twin/{b}/': { get: jsonBody({ type: 'object' }) },
          },
        },
        [
          mapping({ endpoint: 'm.newer', path: 'military-campaigns' }),
          mapping({ endpoint: 'm.post', path: 'status', method: 'POST' }),
          mapping({ endpoint: 'm.twin', path: 'twin/{id}' }),
        ],
      );

      expect(report.unmatched).toEqual([
        expect.objectContaining({
          endpoint: 'm.newer',
          reason: 'path_not_in_spec',
        }),
        expect.objectContaining({
          endpoint: 'm.post',
          reason: 'method_not_in_spec',
        }),
        expect.objectContaining({
          endpoint: 'm.twin',
          reason: 'ambiguous_in_spec',
        }),
      ]);
    });

    it('lists a matched operation with no JSON success body as not compared', () => {
      const report = buildDriftReport(
        { paths: { '/ui/autopilot': { post: { responses: { '204': {} } } } } },
        [
          mapping({
            endpoint: 'ui.post',
            path: 'ui/autopilot',
            method: 'POST',
          }),
        ],
      );

      expect(report).toMatchObject({
        matched: 1,
        compared: 0,
        uncompared: [expect.objectContaining({ endpoint: 'ui.post' })],
      });
    });

    it('uses the first 2xx response that has a JSON body', () => {
      const created = {
        responses: {
          '201': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['fitting_id'],
                  properties: { fitting_id: { type: 'integer' } },
                },
              },
            },
          },
        },
      };
      const report = buildDriftReport(
        { paths: { '/fittings': { post: created } } },
        [
          mapping({
            path: 'fittings/',
            method: 'POST',
            schema: z.looseObject({ fitting_id: z.string() }),
          }),
        ],
      );

      expect(report.findings).toEqual([
        expect.objectContaining({ field: 'fitting_id', kind: 'type_mismatch' }),
      ]);
    });
  });

  describe('field comparison', () => {
    const compare = (schema: unknown, body: object) =>
      buildDriftReport({ paths: { '/x': { get: jsonBody(body) } } }, [
        mapping({ path: 'x', schema }),
      ]).findings.map((f) => `${f.field} ${f.kind}`);

    it('reports each way a field can disagree', () => {
      expect(
        compare(
          z.looseObject({
            both: z.number(),
            loose: z.string().optional(),
            strict: z.string(),
            extra_required: z.number(),
            extra_optional: z.number().optional(),
            kind: z.string(),
          }),
          {
            type: 'object',
            required: ['both', 'loose', 'spec_only', 'kind'],
            properties: {
              both: { type: 'integer' },
              loose: { type: 'string' },
              strict: { type: 'string' },
              spec_only: { type: 'boolean' },
              kind: { type: 'array', items: { type: 'string' } },
            },
          },
        ),
      ).toEqual([
        'loose optional_but_required_in_spec',
        'strict required_but_optional_in_spec',
        'spec_only missing_from_schema',
        'kind type_mismatch',
        'extra_required required_not_in_spec',
        'extra_optional optional_not_in_spec',
      ]);
    });

    it('reports an array schema for an object body at the response itself', () => {
      expect(
        compare(z.array(z.looseObject({})), { type: 'object', properties: {} }),
      ).toEqual(['(response) type_mismatch']);
    });

    it('treats nullable as present, and a default as optional', () => {
      expect(
        compare(
          z.looseObject({
            a: z.string().nullable(),
            b: z.string().default(''),
          }),
          {
            type: 'object',
            required: ['a', 'b'],
            properties: {
              a: { type: ['string', 'null'] },
              b: { type: 'string' },
            },
          },
        ),
      ).toEqual(['b optional_but_required_in_spec']);
    });

    it('accepts enums, esiEnum-style unions, literals, records, free-form objects and oneOf', () => {
      expect(
        compare(
          z.looseObject({
            state: z.union([z.enum(['a', 'b']), z.string()]),
            literal: z.literal('x'),
            meta: z.record(z.string(), z.number()),
            free: z.looseObject({ anything: z.number() }),
            either: z.union([z.string(), z.number()]),
          }),
          {
            type: 'object',
            required: ['state', 'literal', 'meta', 'free', 'either'],
            properties: {
              state: { type: 'string', enum: ['a', 'b'] },
              literal: { type: 'string' },
              meta: { type: 'object', properties: { k: { type: 'integer' } } },
              free: { type: 'object', additionalProperties: true },
              either: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
            },
          },
        ),
      ).toEqual([]);
    });

    it('follows $ref and allOf', () => {
      const report = buildDriftReport(
        {
          paths: {
            '/x': { get: jsonBody({ $ref: '#/components/schemas/Both' }) },
          },
          components: {
            schemas: {
              Both: {
                allOf: [
                  { $ref: '#/components/schemas/A' },
                  {
                    type: 'object',
                    required: ['b'],
                    properties: { b: { type: 'string' } },
                  },
                ],
              },
              A: {
                type: 'object',
                required: ['a'],
                properties: { a: { type: 'integer' } },
              },
            },
          },
        },
        [
          mapping({
            path: 'x',
            schema: z.looseObject({ a: z.number(), c: z.string() }),
          }),
        ],
      );

      expect(report.findings.map((f) => `${f.field} ${f.kind}`)).toEqual([
        'b missing_from_schema',
        'c required_not_in_spec',
      ]);
    });

    it('suppresses an accepted exception by schema name and field, and lists unused ones', () => {
      const report = buildDriftReport(tinySpec, tinyMappings(), {
        ProjectSchema: ['station_id', 'no_such_field'],
      });
      const fields = report.findings.map((f) => f.field);

      expect(fields).not.toContain('station_id');
      expect(fields).not.toContain('[].station_id');
      expect(report.unusedExceptions).toEqual(['ProjectSchema.no_such_field']);
    });
  });

  describe('endpoint definitions', () => {
    it('pairs every path with its own schema, skipping definitions without one', () => {
      expect(
        tinyMappings().map((m) => [m.endpoint, m.path, m.method, m.schemaName]),
      ).toEqual([
        [
          'tinyEndpoints.getCorporationProjects',
          'corporations/{corporationId}/projects',
          'get',
          'ProjectSchema[]',
        ],
        [
          'tinyEndpoints.getCorporationProject',
          'corporations/{corporationId}/projects/{projectId}/',
          'get',
          'ProjectSchema',
        ],
        ['tinyEndpoints.getStatus', 'status/', 'get', 'StatusSchema'],
      ]);
    });

    it('names an inline schema as such and ignores exports that are not endpoint maps', () => {
      const mappings = mappingsFromEndpointModules(
        {
          'x.ts': {
            xEndpoints: {
              getX: { path: 'x', method: 'GET', responseSchema: z.number() },
            },
            notAMap: 42,
          },
        },
        new Map(),
      );

      expect(mappings).toEqual([
        expect.objectContaining({
          endpoint: 'xEndpoints.getX',
          schemaName: '(inline)',
        }),
      ]);
    });
  });

  describe('integrity', () => {
    it('passes a report that compared the mappings', () => {
      expect(
        integrityProblems(buildDriftReport(tinySpec, tinyMappings())),
      ).toEqual([]);
    });

    it('fails a report with no mappings at all', () => {
      expect(integrityProblems(buildDriftReport(tinySpec, []))).toHaveLength(2);
    });

    it('allows unmatched mappings up to the threshold', () => {
      const report = buildDriftReport(tinySpec, [
        ...tinyMappings(),
        mapping({ endpoint: 'm.newer', path: 'newer' }),
      ]);

      expect(integrityProblems(report, 0.25)).toEqual([]);
      expect(integrityProblems(report, 0.2)).toHaveLength(1);
    });
  });

  describe('known-drift baseline', () => {
    const report = buildDriftReport(tinySpec, [
      ...tinyMappings(),
      mapping({ endpoint: 'm.newer', path: 'newer' }),
    ]);
    const allKeys: Record<string, string> = Object.fromEntries(
      report.findings.map((f) => [findingKey(f), 'esi-v2s.21']),
    );
    const current: DriftBaseline = {
      findings: allKeys,
      unmatched: { 'm.newer': 'esi-v2s.25' },
    };
    const sameOnBase: BaseBaseline = {
      ref: 'origin/master',
      baseline: current,
    };
    const withoutFirst = () => {
      const [first, ...rest] = Object.keys(allKeys);
      return {
        first: first!,
        rest: Object.fromEntries(rest.map((key) => [key, allKeys[key]!])),
      };
    };

    it('keys a finding by endpoint, field and kind', () => {
      expect(Object.keys(allKeys)).toContain(
        'tinyEndpoints.getCorporationProjects [].station_id required_not_in_spec',
      );
    });

    it('passes --ci when every finding and unmatched mapping is baselined', () => {
      const ratchet = applyBaseline(report, current, sameOnBase);

      expect(ratchetProblems(ratchet)).toEqual([]);
      expect(exitCodeFor(report, { ci: true, ratchet })).toBe(0);
    });

    it('fails --ci on drift the baseline does not list, but not report mode', () => {
      const { first, rest } = withoutFirst();
      const baseline = { ...current, findings: rest };
      const ratchet = applyBaseline(report, baseline, {
        ref: 'origin/master',
        baseline,
      });

      expect(ratchet.newFindings.map(findingKey)).toEqual([first]);
      expect(exitCodeFor(report, { ci: true, ratchet })).toBe(EXIT_DRIFT);
      expect(exitCodeFor(report, { ci: false, ratchet })).toBe(0);
    });

    it('fails --ci on an unmatched mapping the baseline does not list', () => {
      const baseline = { ...current, unmatched: {} };
      const ratchet = applyBaseline(report, baseline, {
        ref: 'HEAD^1',
        baseline,
      });

      expect(ratchet.newUnmatched.map((u) => u.endpoint)).toEqual(['m.newer']);
      expect(exitCodeFor(report, { ci: true, ratchet })).toBe(EXIT_DRIFT);
    });

    it('fails --ci on a baseline entry whose drift no longer occurs', () => {
      const baseline = {
        findings: {
          ...allKeys,
          'tinyEndpoints.getStatus vip required_not_in_spec': 'esi-v2s.14',
        },
        unmatched: { ...current.unmatched, 'm.gone': 'esi-v2s.25' },
      };
      const ratchet = applyBaseline(report, baseline, {
        ref: 'HEAD^1',
        baseline,
      });

      expect(ratchet.stale).toEqual([
        'tinyEndpoints.getStatus vip required_not_in_spec',
        'm.gone (unmatched)',
      ]);
      expect(exitCodeFor(report, { ci: true, ratchet })).toBe(EXIT_DRIFT);
    });

    it('fails --ci on an entry the base branch does not have: the baseline only shrinks', () => {
      const { first, rest } = withoutFirst();
      const ratchet = applyBaseline(report, current, {
        ref: 'HEAD^1',
        baseline: { findings: rest, unmatched: {} },
      });

      expect(ratchet.added).toEqual([first, 'm.newer (unmatched)']);
      expect(exitCodeFor(report, { ci: true, ratchet })).toBe(EXIT_DRIFT);
    });

    it('allows the entries of the change that introduces the baseline file', () => {
      const ratchet = applyBaseline(report, current, {
        ref: 'HEAD^1',
        baseline: null,
      });

      expect(ratchet.added).toEqual([]);
      expect(exitCodeFor(report, { ci: true, ratchet })).toBe(0);
    });

    it('fails closed when no base ref resolves', () => {
      const ratchet = applyBaseline(report, current, {
        ref: null,
        baseline: null,
      });

      expect(ratchet.baseRefMissing).toBe(true);
      expect(ratchet.added).toHaveLength(Object.keys(allKeys).length + 1);
      expect(ratchetProblems(ratchet).join('\n')).toMatch(
        /SCHEMA_DRIFT_BASE_REF/,
      );
      expect(exitCodeFor(report, { ci: true, ratchet })).toBe(EXIT_DRIFT);
    });

    it('needs no base ref when the baseline is empty and nothing drifts', () => {
      const clean = buildDriftReport(tinySpec, [tinyMappings()[2]!]);
      const ratchet = applyBaseline(
        clean,
        { findings: {}, unmatched: {} },
        { ref: null, baseline: null },
      );

      expect(exitCodeFor(clean, { ci: true, ratchet })).toBe(0);
    });

    it('reports a broken check ahead of the ratchet, in either mode', () => {
      const noOp = buildDriftReport({ paths: {} }, tinyMappings());
      const ratchet = applyBaseline(noOp, current, sameOnBase);

      expect(exitCodeFor(noOp, { ci: false, ratchet })).toBe(EXIT_INTEGRITY);
      expect(exitCodeFor(noOp, { ci: true, ratchet })).toBe(EXIT_INTEGRITY);
    });

    it('round-trips through the file format with sorted keys', () => {
      const text = serializeBaseline(
        {
          findings: { 'b x k': 'esi-v2s.21', 'a x k': 'esi-v2s.10' },
          unmatched: {},
        },
        'comment',
      );

      expect(text.indexOf('a x k')).toBeLessThan(text.indexOf('b x k'));
      expect(parseBaseline(text)).toEqual({
        findings: { 'a x k': 'esi-v2s.10', 'b x k': 'esi-v2s.21' },
        unmatched: {},
      });
    });

    it.each([
      ['an entry with no bead', '{"findings": {"a x k": ""}}'],
      [
        'an entry with a free-text reason',
        '{"findings": {"a x k": "fix later"}}',
      ],
      ['a section that is a list', '{"unmatched": ["m.newer"]}'],
    ])('rejects %s', (_label, raw) => {
      expect(() => parseBaseline(raw)).toThrow();
    });
  });
});

function jsonBody(schema: object) {
  return {
    responses: { '200': { content: { 'application/json': { schema } } } },
  };
}

function mapping(
  overrides: Partial<EndpointSchemaMapping>,
): EndpointSchemaMapping {
  return {
    endpoint: 'm.get',
    path: 'x',
    method: 'GET',
    schemaName: '(inline)',
    schema: z.looseObject({}),
    ...overrides,
  };
}
