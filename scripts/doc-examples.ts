/**
 * npm run test:docs-examples [-- --skip-build] [-- --keep]
 *
 * Type-checks every `ts`/`typescript` block in the consumer-facing Markdown
 * (README.md, guides/, src/sde/README.md, src/sde/docs/) against the packed
 * package, the way a reader who copies it sees it, and runs the blocks marked
 * `runnable` against a stubbed fetch.
 *
 * 1. Extract the blocks and their `<!-- doc-example: ... -->` annotations;
 *    fail on a malformed annotation or a `no-check` without a reason.
 * 2. Check the known-broken baseline (scripts/doc-examples-baseline.json)
 *    only shrinks.
 * 3. Build and pack exactly as the consumer contract does, and install the
 *    tarball into a copy of tests/consumer/package.json outside the repo.
 * 4. Write each block to its own module next to the shared prelude
 *    (tests/doc-examples/prelude.d.ts) and run tsc under nodenext and bundler
 *    resolution, strict, with the package's declarations checked too.
 * 5. Run each `runnable` block with node.
 *
 * The negative fixtures in tests/tdd/doc-examples/fixtures/ go through the
 * same workspace, so the run also proves, against the real package, that a
 * block that does not compile and an import of a sub-path the package does
 * not export are rejected. A fixture that stops failing fails the run.
 *
 * --skip-build packs the existing dist/. --keep leaves the workspace in place.
 */
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

import {
  buildAndPack,
  installedVersion,
  npmInstall,
  step,
} from './consumer-contract';
import {
  DocExample,
  FIXTURES_DIR,
  FIXTURE_EXPECTATIONS,
  HARNESS_DIR,
  Problem,
  REPO_ROOT,
  checkBaseline,
  copyRunner,
  exampleKey,
  extractExamples,
  listDocFiles,
  loadBaseBaseline,
  loadBaseline,
  runExample,
  typeCheckWorkspace,
  writeWorkspace,
} from './doc-examples-core';

function annotate(message: string, file: string, line?: number): void {
  if (!process.env.GITHUB_ACTIONS) return;
  const at = line ? `,line=${line}` : '';
  const text = message.replace(/%/g, '%25').replace(/\r?\n/g, '%0A');
  console.log(`::error file=${file}${at}::${text}`);
}

function extractAll(files: string[]): {
  examples: DocExample[];
  problems: Problem[];
} {
  const examples: DocExample[] = [];
  const problems: Problem[] = [];
  for (const file of files) {
    const result = extractExamples(
      readFileSync(path.join(REPO_ROOT, file), 'utf8'),
      file,
    );
    examples.push(...result.examples);
    problems.push(...result.problems);
  }
  return { examples, problems };
}

function main(): number {
  const args = process.argv.slice(2);
  const skipBuild = args.includes('--skip-build');
  const keep = args.includes('--keep');
  const errors: string[] = [];
  const error = (message: string, file: string, line?: number): void => {
    errors.push(`${file}${line ? `:${line}` : ''}: ${message}`);
    annotate(message, file, line);
  };

  step('Extract examples');
  const docs = extractAll(listDocFiles());
  for (const p of docs.problems) error(p.message, p.file, p.line);
  const fixtureFiles = Object.keys(FIXTURE_EXPECTATIONS).map((name) =>
    path
      .relative(REPO_ROOT, path.join(FIXTURES_DIR, name))
      .split(path.sep)
      .join('/'),
  );
  const fixtures = extractAll(fixtureFiles);

  const count = (mode: DocExample['mode']): number =>
    docs.examples.filter((e) => e.mode === mode).length;
  console.log(
    `  ${docs.examples.length} blocks: ${count('check')} type-checked, ` +
      `${count('runnable')} type-checked and run, ${count('no-check')} no-check`,
  );

  step('Known-broken baseline only shrinks');
  const baseline = loadBaseline();
  const base = baseline.knownBroken.length > 0 ? loadBaseBaseline() : null;
  const { unlisted, stale, added } = checkBaseline(
    docs.examples,
    baseline,
    base,
  );
  const baselineFile = 'scripts/doc-examples-baseline.json';
  for (const key of unlisted) {
    error(
      `${key} is marked no-check with a bead but is not in the baseline. ` +
        'The baseline only shrinks: fix the example instead.',
      baselineFile,
    );
  }
  for (const key of stale) {
    error(
      `${key} is in the baseline but no no-check block naming a bead has that key. ` +
        'Remove the entry.',
      baselineFile,
    );
  }
  for (const key of added) {
    error(
      base === null
        ? `${key}: no base ref (origin/master) to compare the baseline with; fetch master.`
        : `${key} is not in ${base.ref}'s baseline. The baseline only shrinks.`,
      baselineFile,
    );
  }
  console.log(`  ${baseline.knownBroken.length} known-broken entries`);

  const work = mkdtempSync(path.join(tmpdir(), 'esi-doc-examples-'));
  let ok = false;
  try {
    const tarball = buildAndPack(work, skipBuild);

    step('Install into a fresh consumer');
    const consumer = path.join(work, 'consumer');
    cpSync(
      path.join(REPO_ROOT, 'tests', 'consumer', 'package.json'),
      path.join(consumer, 'package.json'),
    );
    npmInstall(consumer, [
      tarball,
      `typescript@${installedVersion('typescript')}`,
      `@types/node@${installedVersion('@types/node')}`,
      `@types/jest@${installedVersion('@types/jest')}`,
    ]);

    step('Type-check every block (nodenext and bundler resolution)');
    const entries = writeWorkspace(
      consumer,
      [...docs.examples, ...fixtures.examples],
      { prelude: path.join(HARNESS_DIR, 'prelude.d.ts') },
    );
    copyRunner(consumer);
    const tsc = path.join(consumer, 'node_modules', 'typescript', 'bin', 'tsc');
    const failures = typeCheckWorkspace(consumer, entries, tsc);
    const failed = new Set(failures.map((f) => f.example));

    step('Run the runnable blocks against a stubbed fetch');
    const runFailures = new Map<DocExample, string>();
    for (const entry of entries) {
      if (entry.example.mode !== 'runnable' || failed.has(entry.example)) {
        continue;
      }
      const output = runExample(consumer, entry);
      if (output !== null) runFailures.set(entry.example, output);
      console.log(
        `  ${output === null ? 'ok  ' : 'FAIL'} ${exampleKey(entry.example)}`,
      );
    }

    const isFixture = (e: DocExample | null): boolean =>
      e !== null && fixtureFiles.includes(e.file);
    for (const f of failures) {
      if (isFixture(f.example)) continue;
      error(
        f.example ? `${exampleKey(f.example)}: ${f.message}` : f.message,
        f.example?.file ?? 'tests/doc-examples/prelude.d.ts',
        f.example ? f.line : undefined,
      );
    }
    for (const [example, output] of runFailures) {
      if (isFixture(example)) continue;
      error(
        `${exampleKey(example)} failed at runtime:\n${output}`,
        example.file,
        example.line,
      );
    }

    step('Negative fixtures are rejected against the packed package');
    for (const [name, expected] of Object.entries(FIXTURE_EXPECTATIONS)) {
      const file = fixtureFiles.find((f) => f.endsWith(`/${name}`))!;
      const rejected =
        fixtures.problems.some((p) => p.file === file) ||
        failures.some((f) => f.example?.file === file) ||
        [...runFailures.keys()].some((e) => e.file === file);
      const pass = expected === 'accepted' ? !rejected : rejected;
      console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${name}: expected ${expected}`);
      if (!pass) {
        const detail = [
          ...fixtures.problems
            .filter((p) => p.file === file)
            .map((p) => p.message),
          ...failures
            .filter((f) => f.example?.file === file)
            .map((f) => f.message),
          ...[...runFailures]
            .filter(([e]) => e.file === file)
            .map(([, o]) => o),
        ].join('\n');
        error(
          expected === 'accepted'
            ? `the compliant fixture was rejected:\n${detail}`
            : `the fixture was accepted; the check no longer catches this (${expected})`,
          file,
        );
      }
    }

    console.log('\n--- Summary ---');
    console.log(`Blocks found:        ${docs.examples.length}`);
    console.log(`Type-checked:        ${count('check') + count('runnable')}`);
    console.log(`  of which run:      ${count('runnable')}`);
    console.log(`no-check:            ${count('no-check')}`);
    console.log(`  known-broken:      ${baseline.knownBroken.length}`);
    console.log(`Errors:              ${errors.length}`);

    ok = errors.length === 0;
  } finally {
    if (keep || !ok) {
      console.log(`\nWorkspace kept at ${work}`);
    } else {
      rmSync(work, { recursive: true, force: true });
    }
  }

  if (errors.length > 0) {
    console.error(`\n${errors.join('\n\n')}`);
    return 1;
  }
  console.log('\nDocumentation examples passed.');
  return 0;
}

try {
  process.exit(main());
} catch (err) {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
