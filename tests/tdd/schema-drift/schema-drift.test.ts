import { readFileSync } from 'fs';
import * as path from 'path';
import {
  EndpointSchemaMapping,
  OpenApiSpec,
  SchemaDriftReport,
  buildDriftReport,
  exitCodeFor,
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

/** The mappings the CLI would build from the fixture endpoint map. */
function tinyMappings(): EndpointSchemaMapping[] {
  return Object.entries(tinyEndpoints).map(([name, def]) => {
    const element =
      (def.responseSchema as { element?: unknown }).element ??
      def.responseSchema;
    return {
      endpoint: `tinyEndpoints.${name}`,
      path: def.path,
      method: def.method.toLowerCase(),
      schemaName: schemaNames.get(element) ?? '(inline)',
      schema: def.responseSchema,
    };
  });
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
});
