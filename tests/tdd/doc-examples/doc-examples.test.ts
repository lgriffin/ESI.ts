/**
 * Self-tests for the documentation example check (npm run test:docs-examples).
 *
 * The check exists to fail when an example stops compiling, so it has to be
 * seen failing. The fixtures in ./fixtures are run through the real pipeline
 * (workspace layout, tsc under nodenext and bundler resolution, the runnable
 * runner) against a stub package installed in a temporary directory: a block
 * that calls a renamed method, an import of a sub-path the package's
 * `exports` does not list, and a `no-check` without a reason must each be
 * rejected, and a compliant file must pass. Packing the real library takes
 * too long for the unit suite; the npm script puts the same fixtures through
 * the packed package.
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

import {
  Baseline,
  DocExample,
  FIXTURES_DIR,
  FIXTURE_EXPECTATIONS,
  Failure,
  HARNESS_DIR,
  Problem,
  REPO_ROOT,
  WorkspaceEntry,
  checkBaseline,
  copyRunner,
  exampleKey,
  extractExamples,
  listDocFiles,
  loadBaseline,
  mapDiagnostics,
  moduleSource,
  parseDirectives,
  runExample,
  typeCheckWorkspace,
  writeWorkspace,
} from '../../../scripts/doc-examples-core';

const fence = '```';

function example(overrides: Partial<DocExample> = {}): DocExample {
  return {
    file: 'README.md',
    heading: 'Quick Start',
    ordinal: 1,
    line: 10,
    code: 'const x = 1;',
    mode: 'check',
    ...overrides,
  };
}

describe('parseDirectives', () => {
  it('treats an empty info string as a checked block', () => {
    expect(parseDirectives('')).toEqual({ mode: 'check' });
    expect(parseDirectives('   ')).toEqual({ mode: 'check' });
  });

  it('accepts runnable', () => {
    expect(parseDirectives('runnable')).toEqual({ mode: 'runnable' });
  });

  it('rejects text after runnable', () => {
    expect(parseDirectives('runnable please')).toMatch(/unexpected text/);
  });

  it('accepts no-check with a reason, with or without a separator', () => {
    expect(parseDirectives('no-check signature listing')).toEqual({
      mode: 'no-check',
      reason: 'signature listing',
    });
    expect(parseDirectives('no-check: signature listing')).toEqual({
      mode: 'no-check',
      reason: 'signature listing',
    });
    expect(parseDirectives('no-check — esi-abc.1 renamed')).toEqual({
      mode: 'no-check',
      reason: 'esi-abc.1 renamed',
    });
  });

  it('rejects no-check without a reason', () => {
    expect(parseDirectives('no-check')).toMatch(/needs a reason/);
    expect(parseDirectives('no-check :')).toMatch(/needs a reason/);
  });

  it('rejects an unknown directive rather than ignoring it', () => {
    expect(parseDirectives('no_check because')).toMatch(/unknown/);
    expect(parseDirectives('title="x.ts"')).toMatch(/unknown/);
  });
});

describe('extractExamples', () => {
  it('finds ts and typescript fences only, with heading, ordinal and line', () => {
    const md = [
      '# Title', // 1
      '## Usage', // 2
      `${fence}ts`, // 3
      'const a = 1;', // 4
      fence, // 5
      `${fence}bash`, // 6
      'npm test', // 7
      fence, // 8
      `${fence}TypeScript`, // 9
      'const b = 2;', // 10
      'const c = 3;', // 11
      fence, // 12
      '## Other', // 13
      `${fence}js`, // 14
      'const d = 4;', // 15
      fence, // 16
    ].join('\n');
    const { examples, problems } = extractExamples(md, 'doc.md');
    expect(problems).toEqual([]);
    expect(
      examples.map(({ heading, ordinal, line, code, mode }) => ({
        heading,
        ordinal,
        line,
        code,
        mode,
      })),
    ).toEqual([
      {
        heading: 'Usage',
        ordinal: 1,
        line: 4,
        code: 'const a = 1;',
        mode: 'check',
      },
      {
        heading: 'Usage',
        ordinal: 2,
        line: 10,
        code: 'const b = 2;\nconst c = 3;',
        mode: 'check',
      },
    ]);
    expect(exampleKey(examples[1]!)).toBe('doc.md#Usage [2]');
  });

  it('ignores a heading-like line inside a fence', () => {
    const md = [
      '## Real',
      `${fence}md`,
      '## Not a heading',
      fence,
      `${fence}ts`,
      'x;',
      fence,
    ].join('\n');
    expect(extractExamples(md, 'd.md').examples[0]!.heading).toBe('Real');
  });

  it('reads directives from the info string', () => {
    const md = [`${fence}ts runnable`, 'x;', fence].join('\n');
    expect(extractExamples(md, 'd.md').examples[0]!.mode).toBe('runnable');
  });

  it('reads directives from a comment above the fence, across blank lines', () => {
    const md = [
      '<!-- doc-example: no-check signature listing -->',
      '',
      `${fence}typescript`,
      'getType(id: number): EveType | null',
      fence,
    ].join('\n');
    const { examples, problems } = extractExamples(md, 'd.md');
    expect(problems).toEqual([]);
    expect(examples[0]).toMatchObject({
      mode: 'no-check',
      reason: 'signature listing',
    });
    expect(examples[0]!.bead).toBeUndefined();
  });

  it('records the bead a no-check reason names', () => {
    const md = [
      '<!-- doc-example: no-check esi-23g.9 getFoo was removed -->',
      `${fence}ts`,
      'client.getFoo();',
      fence,
    ].join('\n');
    expect(extractExamples(md, 'd.md').examples[0]!.bead).toBe('esi-23g.9');
  });

  it('rejects a no-check without a reason and does not skip the block silently', () => {
    const md = ['<!-- doc-example: no-check -->', `${fence}ts`, 'x;', fence];
    const { examples, problems } = extractExamples(md.join('\n'), 'd.md');
    expect(examples).toEqual([]);
    expect(problems).toEqual<Problem[]>([
      { file: 'd.md', line: 1, message: expect.stringMatching(/reason/) },
    ]);
  });

  it('rejects no-check in the info string, where it can carry no reason', () => {
    const md = [`${fence}ts no-check`, 'x;', fence].join('\n');
    expect(extractExamples(md, 'd.md').problems[0]!.message).toMatch(
      /needs a reason/,
    );
  });

  it('rejects directives given twice', () => {
    const md = [
      '<!-- doc-example: no-check listing -->',
      `${fence}ts runnable`,
      'x;',
      fence,
    ].join('\n');
    expect(extractExamples(md, 'd.md').problems[0]!.message).toMatch(
      /both the fence and a doc-example comment/,
    );
  });

  it('rejects a comment that does not sit on a ts block', () => {
    const dangling = ['<!-- doc-example: runnable -->', 'Some prose.'];
    expect(
      extractExamples(dangling.join('\n'), 'd.md').problems[0],
    ).toMatchObject({
      line: 1,
      message: expect.stringMatching(/not followed/),
    });

    const onBash = [
      '<!-- doc-example: runnable -->',
      `${fence}bash`,
      'ls',
      fence,
    ];
    expect(
      extractExamples(onBash.join('\n'), 'd.md').problems[0]!.message,
    ).toMatch(/"bash" block/);

    const atEnd = ['<!-- doc-example: runnable -->'];
    expect(extractExamples(atEnd.join('\n'), 'd.md').problems).toHaveLength(1);
  });

  it('strips the list-item indent from an indented fence and handles tildes and CRLF', () => {
    const md = [
      '1. Step',
      '   ```ts',
      '   export class A {',
      '     x = 1;',
      '   }',
      '   ```',
      '~~~typescript',
      'const y = 2;',
      '~~~',
    ].join('\r\n');
    const { examples } = extractExamples(md, 'd.md');
    expect(examples.map((e) => e.code)).toEqual([
      'export class A {\n  x = 1;\n}',
      'const y = 2;',
    ]);
  });
});

describe('moduleSource', () => {
  it('keeps code lines where they are and makes the block a module', () => {
    expect(moduleSource(example({ code: 'a;\nb;' }))).toBe(
      'a;\nb;\nexport {};\n',
    );
  });
});

describe('mapDiagnostics', () => {
  const entries: WorkspaceEntry[] = [
    { example: example({ line: 40 }), module: 'examples/001-readme.mts' },
  ];

  it('maps a module line to the Markdown line and keeps continuation lines', () => {
    const output = [
      "examples/001-readme.mts(3,7): error TS2339: Property 'getServerStatus' does not exist.",
      '  Did you mean getStatus?',
      "prelude.d.ts(1,1): error TS2307: Cannot find module '@lgriffin/esi.ts'.",
      'error TS5083: Cannot read file tsconfig.json.',
    ].join('\n');
    expect(mapDiagnostics(output, entries, 'nodenext')).toEqual<Failure[]>([
      {
        example: entries[0]!.example,
        line: 42,
        message:
          "[nodenext] TS2339: Property 'getServerStatus' does not exist.\n  Did you mean getStatus?",
      },
      {
        example: null,
        line: 1,
        message:
          "[nodenext] prelude.d.ts: TS2307: Cannot find module '@lgriffin/esi.ts'.",
      },
      {
        example: null,
        line: 0,
        message: '[nodenext] error TS5083: Cannot read file tsconfig.json.',
      },
    ]);
  });

  it('accepts Windows separators in module paths', () => {
    const output = 'examples\\001-readme.mts(1,1): error TS1005: x';
    expect(mapDiagnostics(output, entries, 'bundler')[0]!.example).toBe(
      entries[0]!.example,
    );
  });
});

describe('checkBaseline', () => {
  const broken = example({
    heading: 'Old',
    mode: 'no-check',
    reason: 'esi-x.1 renamed',
    bead: 'esi-x.1',
  });
  const listing = example({
    heading: 'Listing',
    mode: 'no-check',
    reason: 'signature listing',
  });
  const baseline: Baseline = { knownBroken: ['README.md#Old [1]'] };

  it('passes when every known-broken block is listed and nothing grew', () => {
    expect(
      checkBaseline([broken, listing], baseline, {
        ref: 'origin/master',
        present: true,
        entries: new Set(['README.md#Old [1]']),
      }),
    ).toEqual({ unlisted: [], stale: [], added: [] });
  });

  it('reports a no-check naming a bead that the baseline omits', () => {
    expect(checkBaseline([broken], { knownBroken: [] }, null).unlisted).toEqual(
      ['README.md#Old [1]'],
    );
  });

  it('reports an entry whose block was fixed, so the list shrinks', () => {
    const fixed = { ...broken, mode: 'check' as const };
    expect(checkBaseline([fixed], baseline, null).stale).toEqual([
      'README.md#Old [1]',
    ]);
  });

  it('reports an entry the integration branch does not have', () => {
    expect(
      checkBaseline([broken], baseline, {
        ref: 'origin/master',
        present: true,
        entries: new Set(),
      }).added,
    ).toEqual(['README.md#Old [1]']);
  });

  it('fails closed without a base ref, and accepts the file being introduced', () => {
    expect(checkBaseline([broken], baseline, null).added).toEqual([
      'README.md#Old [1]',
    ]);
    expect(
      checkBaseline([broken], baseline, {
        ref: 'origin/master',
        present: false,
        entries: new Set(),
      }).added,
    ).toEqual([]);
  });
});

describe('the repository documentation', () => {
  it('has well-formed annotations and a baseline that matches them', () => {
    const examples: DocExample[] = [];
    const problems: Problem[] = [];
    for (const file of listDocFiles()) {
      const result = extractExamples(
        readFileSync(path.join(REPO_ROOT, file), 'utf8'),
        file,
      );
      examples.push(...result.examples);
      problems.push(...result.problems);
    }
    expect(problems).toEqual([]);
    expect(examples.length).toBeGreaterThan(0);
    const { unlisted, stale } = checkBaseline(examples, loadBaseline(), null);
    expect({ unlisted, stale }).toEqual({ unlisted: [], stale: [] });
  });

  it('scans the README, the guides and the SDE docs', () => {
    const files = listDocFiles();
    expect(files).toEqual(
      expect.arrayContaining([
        'README.md',
        'guides/DOCUMENTATION.md',
        'src/sde/README.md',
        'src/sde/docs/USAGE.md',
      ]),
    );
  });
});

describe('the fixtures, checked against a stub package', () => {
  let work: string;
  const problemsByFile = new Map<string, Problem[]>();
  const failuresByFile = new Map<string, string[]>();

  beforeAll(() => {
    work = mkdtempSync(path.join(tmpdir(), 'esi-doc-examples-test-'));
    const stub = path.join(FIXTURES_DIR, 'stub-package');
    const pkg = path.join(work, 'node_modules', '@lgriffin', 'esi.ts');
    // Stored as package.stub.json so Jest's module map does not see a second
    // package named @lgriffin/esi.ts.
    cpSync(
      path.join(stub, 'package.stub.json'),
      path.join(pkg, 'package.json'),
    );
    for (const name of ['index.d.ts', 'index.js', 'errors.d.ts', 'errors.js']) {
      cpSync(path.join(stub, name), path.join(pkg, 'dist', name));
    }

    const examples: DocExample[] = [];
    for (const name of Object.keys(FIXTURE_EXPECTATIONS)) {
      const result = extractExamples(
        readFileSync(path.join(FIXTURES_DIR, name), 'utf8'),
        name,
      );
      examples.push(...result.examples);
      problemsByFile.set(name, result.problems);
      failuresByFile.set(name, []);
    }

    const entries = writeWorkspace(work, examples, {
      prelude: path.join(FIXTURES_DIR, 'stub-prelude.d.ts'),
      typeRoots: [path.join(REPO_ROOT, 'node_modules', '@types')],
    });
    copyRunner(work, HARNESS_DIR);
    const tsc = path.join(
      REPO_ROOT,
      'node_modules',
      'typescript',
      'bin',
      'tsc',
    );
    for (const f of typeCheckWorkspace(work, entries, tsc)) {
      const key = f.example?.file ?? '(outside any example)';
      failuresByFile.set(key, [...(failuresByFile.get(key) ?? []), f.message]);
    }
    const failed = new Set(
      [...failuresByFile].filter(([, v]) => v.length > 0).map(([k]) => k),
    );
    for (const entry of entries) {
      if (entry.example.mode !== 'runnable' || failed.has(entry.example.file))
        continue;
      const output = runExample(work, entry);
      if (output !== null) {
        failuresByFile.get(entry.example.file)!.push(`runtime: ${output}`);
      }
    }
  }, 120_000);

  afterAll(() => {
    rmSync(work, { recursive: true, force: true });
  });

  it('reports nothing outside the examples (the prelude and stub compile)', () => {
    expect(failuresByFile.get('(outside any example)')).toBeUndefined();
  });

  it('accepts the compliant fixture, including running its runnable block', () => {
    expect(FIXTURE_EXPECTATIONS['compliant.md']).toBe('accepted');
    expect(problemsByFile.get('compliant.md')).toEqual([]);
    expect(failuresByFile.get('compliant.md')).toEqual([]);
  });

  it('rejects a block that calls a method the package does not have', () => {
    const failures = failuresByFile.get('type-error.md')!;
    expect(failures.some((m) => /\[nodenext\] TS2339/.test(m))).toBe(true);
    expect(failures.some((m) => /\[bundler\] TS2339/.test(m))).toBe(true);
  });

  it('rejects an import of a sub-path the exports map does not list', () => {
    const failures = failuresByFile.get('bad-subpath.md')!;
    expect(failures.some((m) => /\[nodenext\] TS2307/.test(m))).toBe(true);
    expect(failures.some((m) => /\[bundler\] TS2307/.test(m))).toBe(true);
  });

  it('rejects a no-check without a reason', () => {
    expect(problemsByFile.get('no-check-without-reason.md')).toEqual([
      expect.objectContaining({ message: expect.stringMatching(/reason/) }),
    ]);
  });

  it('fails a runnable block that caught the error from an unrouted request', () => {
    writeFileSync(
      path.join(work, 'out', 'swallows.mjs'),
      "try { await fetch('https://esi.evetech.net/nowhere/'); } catch {}\n",
    );
    const entry: WorkspaceEntry = {
      example: example({ mode: 'runnable' }),
      module: 'examples/swallows.mts',
    };
    expect(runExample(work, entry)).toMatch(/no stub route.*GET \/nowhere\//);
  });

  it('runs a runnable block and reports a runtime failure', () => {
    const entry: WorkspaceEntry = {
      example: example({ mode: 'runnable' }),
      module: 'examples/does-not-exist.mts',
    };
    expect(runExample(work, entry)).toMatch(/exit 1/);
  });
});
