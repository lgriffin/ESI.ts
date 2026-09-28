/**
 * npm run sde:drift [-- --dir <extracted export>] [-- --build <n>] [-- --out <file>]
 *
 * Compares an extracted SDE export (the directory `sde:ingest` writes) with
 * what the module knows: the file list against SDE_FILE_REGISTRY and each
 * registered file's record keys against the table's Zod schema. Offline; the
 * export must already be on disk. See sde-drift-core.ts for what counts as
 * drift.
 *
 * Writes reports/sde-drift.json (or --out) and, under GitHub Actions, the
 * step summary. Exit 0 with no drift, 1 with drift, 2 when the check could
 * not run (no export at --dir, an unreadable file). The build defaults to
 * the one `_sde.yaml` in the directory names.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
} from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

import { parseSdeMetadata } from '../../src/sde/ingestion/metadata';
import { SDE_METADATA_FILENAME } from '../../src/sde/ingestion/constants';
import {
  EXIT_DRIFT,
  EXIT_FAILURE,
  REPORT_FILE,
  analyseDrift,
  renderReport,
  type ObservedFile,
} from './sde-drift-core';

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
}

function readRecords(file: string): ObservedFile['records'] {
  const content = readFileSync(file, 'utf-8');
  // An empty file is a table with no records (js-yaml refuses to parse one).
  if (content.trim() === '') return [];
  const parsed = yaml.load(content);
  if (parsed == null) return [];
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${file} is not a YAML map keyed by ID`);
  }
  return Object.entries(parsed as Record<string, unknown>).map(
    ([key, value]) => {
      const numKey = Number(key);
      const id = Number.isNaN(numKey) ? key : numKey;
      const raw =
        value != null && typeof value === 'object' && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : {};
      return [id, raw] as const;
    },
  );
}

function main(): number {
  const root = path.resolve(__dirname, '../..');
  const dir = path.resolve(flag('--dir') ?? path.join(root, 'sde-data'));
  const out = path.resolve(flag('--out') ?? path.join(root, REPORT_FILE));
  if (!existsSync(dir)) {
    console.error(
      `No extracted export at ${dir}; run npm run sde:ingest first.`,
    );
    return EXIT_FAILURE;
  }
  let build = flag('--build');
  const metadataFile = path.join(dir, SDE_METADATA_FILENAME);
  if (!build && existsSync(metadataFile)) {
    build = parseSdeMetadata(readFileSync(metadataFile, 'utf-8')).buildNumber;
  }
  const files = readdirSync(dir).filter((f) => f.endsWith('.yaml'));
  const report = analyseDrift({
    build: build ?? 'unknown',
    checkedAt: new Date().toISOString(),
    files,
    read: (spec) => ({
      yamlFile: spec.yamlFile,
      records: readRecords(path.join(dir, spec.yamlFile)),
    }),
  });
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  const rendered = renderReport(report);
  console.log(rendered);
  console.log(`Report written to ${path.relative(root, out)}`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, rendered + '\n');
  }
  return report.hasDrift ? EXIT_DRIFT : 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = EXIT_FAILURE;
}
