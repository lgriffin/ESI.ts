/**
 * Self-tests for the SDE export drift check (scripts/sde/sde-drift.ts).
 *
 * The fixture directory under fixtures/sde-drift is a tiny export: two
 * registered files, one of them carrying a record with a key the schema does
 * not declare, and one file the registry does not list. The check must name
 * both and nothing else. The last cases run over the real registry, so every
 * registered file keeps a schema to compare against and the nightly workflow
 * keeps pointing at the URLs the module downloads from.
 */
import { execFileSync } from 'child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';

import {
  SDE_DOWNLOAD_URL,
  SDE_FILE_REGISTRY,
  SDE_LATEST_BUILD_URL,
  type SdeFileSpec,
} from '../../../src/sde/ingestion/constants';
import {
  EXIT_DRIFT,
  EXIT_FAILURE,
  SCHEMA_BY_FILE,
  analyseDrift,
  fieldDrift,
  renderReport,
  schemaFor,
  schemaKeys,
  type DriftReport,
  type ObservedFile,
} from '../../../scripts/sde/sde-drift-core';

const ROOT = path.resolve(__dirname, '../../..');
const FIXTURE = path.join(__dirname, 'fixtures/sde-drift');
const SCRIPT = path.join(ROOT, 'scripts/sde/sde-drift.ts');

function readFixture(spec: SdeFileSpec): ObservedFile {
  const parsed = yaml.load(
    readFileSync(path.join(FIXTURE, spec.yamlFile), 'utf-8'),
  ) as Record<string, Record<string, unknown>>;
  return {
    yamlFile: spec.yamlFile,
    records: Object.entries(parsed).map(([id, raw]) => [Number(id), raw]),
  };
}

const fixtureFiles = [
  '_sde.yaml',
  'categories.yaml',
  'groups.yaml',
  'mapRegionsExtended.yaml',
];

function runScript(args: string[]): { status: number; stdout: string } {
  try {
    const stdout = execFileSync(
      'npx',
      ['ts-node', '--transpile-only', SCRIPT, ...args],
      { cwd: ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return { status: 0, stdout };
  } catch (error) {
    const failed = error as { status: number; stdout: string };
    return { status: failed.status, stdout: failed.stdout };
  }
}

describe('SDE export drift over the fixture export', () => {
  const report = analyseDrift({
    build: '20260901',
    checkedAt: '2026-09-28T00:00:00.000Z',
    files: fixtureFiles,
    read: readFixture,
  });

  it('names the file the registry does not list, and not the metadata file', () => {
    expect(report.unknownFiles).toEqual(['mapRegionsExtended.yaml']);
  });

  it('names every registered file the export does not carry', () => {
    expect(report.missingFiles).toHaveLength(SDE_FILE_REGISTRY.length - 2);
    expect(report.missingFiles).toContain('types.yaml');
    expect(report.missingFiles).not.toContain('categories.yaml');
  });

  it('names the key one category carries that the schema does not declare, after the transform', () => {
    // iconID normalises to the schema's iconId, so it is not new; sortOrder is.
    expect(report.fields).toEqual([
      {
        yamlFile: 'categories.yaml',
        tableName: 'eve_categories',
        records: 2,
        newKeys: ['sortOrder'],
        goneKeys: [],
      },
    ]);
  });

  it('reports drift', () => {
    expect(report.hasDrift).toBe(true);
    expect(report.registered).toBe(SDE_FILE_REGISTRY.length);
    expect(report.observed).toBe(4);
  });

  it('renders each finding once', () => {
    const rendered = renderReport(report);
    expect(rendered).toContain('build 20260901');
    expect(rendered).toContain('`mapRegionsExtended.yaml`');
    expect(rendered).toContain(
      '| `categories.yaml` | `eve_categories` | 2 | `sortOrder` |  |',
    );
    expect(rendered).toContain('Drift: yes');
  });
});

describe('field drift', () => {
  const spec = SDE_FILE_REGISTRY.find((s) => s.yamlFile === 'groups.yaml')!;
  const schema = schemaFor('groups.yaml')!;
  const full = {
    name: { en: 'Mineral' },
    categoryID: 4,
    published: true,
    anchorable: false,
    anchored: false,
    fittableNonSingleton: false,
    useBasePrice: false,
  };

  it('compares the transformed keys, so a renamed ID and a localised name are not new', () => {
    const drift = fieldDrift(
      { yamlFile: 'groups.yaml', records: [[18, full]] },
      spec,
      schema,
    );
    expect(drift).toEqual({
      yamlFile: 'groups.yaml',
      tableName: 'eve_groups',
      records: 1,
      newKeys: [],
      goneKeys: [],
    });
  });

  it('reports a required key no record carries as gone, and a nullable one as absent', () => {
    const withoutPublished: Record<string, unknown> = { ...full };
    delete withoutPublished.published;
    const drift = fieldDrift(
      { yamlFile: 'groups.yaml', records: [[18, withoutPublished]] },
      spec,
      schema,
    );
    expect(drift.goneKeys).toEqual(['published']);
    expect(schemaKeys(schema).required).not.toContain('iconId');
  });

  it('does not report the ID gone for a file whose records carry it instead of the map key', () => {
    const spec = SDE_FILE_REGISTRY.find(
      (s) => s.yamlFile === 'characterTitles.yaml',
    )!;
    expect(spec.injectId).toBe(false);
    const drift = fieldDrift(
      {
        yamlFile: spec.yamlFile,
        records: [['title-1', { name: { en: 'Title' } }]],
      },
      spec,
      z.looseObject({ characterTitleId: z.string(), name: z.string() }),
    );
    expect(drift.goneKeys).toEqual([]);
    expect(drift.newKeys).toEqual([]);
  });

  it('reports nothing gone for a file with no records', () => {
    const drift = fieldDrift(
      { yamlFile: 'groups.yaml', records: [] },
      spec,
      schema,
    );
    expect(drift.goneKeys).toEqual([]);
    expect(drift.records).toBe(0);
  });

  it('reports no drift for an export that matches the registry and schemas', () => {
    const report = analyseDrift(
      {
        build: 'x',
        checkedAt: 'now',
        files: ['groups.yaml'],
        read: () => ({ yamlFile: 'groups.yaml', records: [[18, full]] }),
      },
      [spec],
    );
    expect(report.hasDrift).toBe(false);
    expect(renderReport(report)).toContain('Drift: none');
  });
});

describe('the registry and the schemas', () => {
  it.each(SDE_FILE_REGISTRY.map((s) => s.yamlFile))(
    '%s has a schema to compare against',
    (yamlFile) => {
      expect(SCHEMA_BY_FILE[yamlFile]).toBeDefined();
      const schema = schemaFor(yamlFile);
      expect(schema).not.toBeNull();
      expect(schemaKeys(schema!).declared.length).toBeGreaterThan(0);
    },
  );

  it('maps no file the registry does not list', () => {
    const registered = new Set(SDE_FILE_REGISTRY.map((s) => s.yamlFile));
    for (const file of Object.keys(SCHEMA_BY_FILE)) {
      expect(registered.has(file)).toBe(true);
    }
  });

  it("declares every injected ID attribute in the file's schema", () => {
    for (const spec of SDE_FILE_REGISTRY.filter((s) => s.injectId)) {
      const { declared } = schemaKeys(schemaFor(spec.yamlFile)!);
      expect(declared).toContain(spec.idAttribute);
    }
  });
});

describe('the nightly workflow', () => {
  const workflow = readFileSync(
    path.join(ROOT, '.github/workflows/nightly-sde.yml'),
    'utf-8',
  );

  it('resolves the build and downloads the export from the URLs the module uses', () => {
    expect(workflow).toContain(SDE_LATEST_BUILD_URL);
    expect(workflow).toContain(SDE_DOWNLOAD_URL);
  });

  it('runs the drift check, the real-data tests and the SDE examples', () => {
    expect(workflow).toContain('npm run sde:drift');
    expect(workflow).toContain('SDE_REQUIRE_DATA');
    expect(workflow).toContain('tests/integration/sde');
    expect(workflow).toContain('examples:nightly -- --tier sde');
  });
});

describe('scripts/sde/sde-drift.ts', () => {
  let out: string;
  beforeAll(() => {
    out = mkdtempSync(path.join(tmpdir(), 'sde-drift-'));
  });
  afterAll(() => {
    rmSync(out, { recursive: true, force: true });
  });

  it('exits 1 on the fixture export and writes the report', () => {
    const reportPath = path.join(out, 'sde-drift.json');
    const { status, stdout } = runScript([
      '--dir',
      FIXTURE,
      '--out',
      reportPath,
    ]);
    expect(status).toBe(EXIT_DRIFT);
    expect(stdout).toContain('build 20260901');
    const report = JSON.parse(readFileSync(reportPath, 'utf-8')) as DriftReport;
    expect(report.build).toBe('20260901');
    expect(report.unknownFiles).toEqual(['mapRegionsExtended.yaml']);
    expect(report.fields.map((f) => f.newKeys)).toEqual([['sortOrder']]);
  });

  it('reads an empty registered file as a table with no records', () => {
    const dir = path.join(out, 'with-empty');
    cpSync(FIXTURE, dir, { recursive: true });
    writeFileSync(path.join(dir, 'landmarks.yaml'), '');
    const reportPath = path.join(dir, 'report.json');
    const { status } = runScript(['--dir', dir, '--out', reportPath]);
    expect(status).toBe(EXIT_DRIFT);
    const report = JSON.parse(readFileSync(reportPath, 'utf-8')) as DriftReport;
    expect(report.missingFiles).not.toContain('landmarks.yaml');
    expect(report.observed).toBe(5);
    expect(report.fields.map((f) => f.yamlFile)).toEqual(['categories.yaml']);
  });

  it('exits 2 when there is no export to read', () => {
    const { status } = runScript(['--dir', path.join(out, 'missing')]);
    expect(status).toBe(EXIT_FAILURE);
  });
});
