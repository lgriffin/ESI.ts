/**
 * Documentation example checks: the parts that need no packed tarball.
 *
 * Every fenced `ts`/`typescript` block in the consumer-facing Markdown is an
 * example a reader will copy. `doc-examples.ts` installs the packed library
 * into a scratch consumer and type-checks each block there as its own module;
 * this module holds everything that does not need the tarball, so Jest can
 * drive it against a stub package:
 *
 * - finding the blocks and their annotations (`extractExamples`),
 * - laying out a consumer workspace and type-checking it (`writeWorkspace`,
 *   `typeCheckWorkspace`),
 * - running the blocks marked `runnable` against a stubbed `fetch`
 *   (`runExample`),
 * - the known-broken baseline ratchet (`checkBaseline`).
 *
 * The annotation convention is documented in guides/DOCUMENTATION.md.
 */

import { execFileSync, spawnSync } from 'child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';

export const REPO_ROOT = path.resolve(__dirname, '..');
export const BASELINE_PATH = path.resolve(
  __dirname,
  'doc-examples-baseline.json',
);
/** Prelude, stub fetch and runner copied into every consumer workspace. */
export const HARNESS_DIR = path.join(REPO_ROOT, 'tests', 'doc-examples');

/**
 * The Markdown a consumer reads, relative to the repository root. A directory
 * entry means every `*.md` directly inside it.
 */
export const DOC_SOURCES = [
  'README.md',
  'guides',
  'src/sde/README.md',
  'src/sde/docs',
];

/**
 * The fixtures every run must classify correctly, so a check that silently
 * stops firing fails. Jest checks them against a stub package; the npm script
 * checks them again against the packed one.
 */
export const FIXTURES_DIR = path.join(
  REPO_ROOT,
  'tests',
  'tdd',
  'doc-examples',
  'fixtures',
);
export const FIXTURE_EXPECTATIONS: Record<
  string,
  | 'accepted'
  | 'syntax error'
  | 'type error'
  | 'unexported sub-path'
  | 'annotation error'
> = {
  'compliant.md': 'accepted',
  'syntax-error.md': 'syntax error',
  'type-error.md': 'type error',
  'bad-subpath.md': 'unexported sub-path',
  'no-check-without-reason.md': 'annotation error',
};

const EXAMPLE_LANGUAGES = new Set(['ts', 'typescript']);
const DIRECTIVE_COMMENT = /^\s*<!--\s*doc-example:\s*(.*?)\s*-->\s*$/;
const BEAD = /\besi-[a-z0-9]+(?:\.[a-z0-9]+)*\b/;

export type ExampleMode = 'check' | 'runnable' | 'no-check';

export interface DocExample {
  /** Markdown file, relative to the repository root, `/`-separated. */
  file: string;
  /** Text of the nearest heading above the block, or '' before any heading. */
  heading: string;
  /** 1-based position among the examples under that heading. */
  ordinal: number;
  /** 1-based Markdown line of the first line of code (after the fence). */
  line: number;
  code: string;
  mode: ExampleMode;
  /** Why a `no-check` block is skipped. */
  reason?: string;
  /** The bead a `no-check` reason names, which puts it in the baseline. */
  bead?: string;
}

export interface Problem {
  file: string;
  line: number;
  message: string;
}

/** Stable identity of a block: survives edits elsewhere in the file. */
export function exampleKey(example: DocExample): string {
  return `${example.file}#${example.heading} [${example.ordinal}]`;
}

interface Directives {
  mode: ExampleMode;
  reason?: string;
}

/**
 * Parses the words after the language in a fence (```ts runnable) or the body
 * of a `<!-- doc-example: ... -->` comment. Returns an error message instead
 * when the text is not a directive this checker knows, so a typo cannot
 * silently turn a check off.
 */
export function parseDirectives(text: string): Directives | string {
  const trimmed = text.trim();
  if (trimmed === '') return { mode: 'check' };
  const [first, ...rest] = trimmed.split(/\s+/);
  // `no-check: reason` reads naturally; the colon belongs to the separator.
  const word = first!.replace(/:$/, '');
  const remainder = rest.join(' ').trim();
  if (word === 'runnable') {
    return remainder === ''
      ? { mode: 'runnable' }
      : `unexpected text after "runnable": "${remainder}"`;
  }
  if (word === 'no-check') {
    const reason = remainder.replace(/^[:—–-]\s*/, '').trim();
    return reason === ''
      ? '"no-check" needs a reason: <!-- doc-example: no-check <why this block is not checked> -->'
      : { mode: 'no-check', reason };
  }
  return `unknown doc-example directive "${word}" (expected "runnable" or "no-check <reason>")`;
}

/**
 * Finds every `ts`/`typescript` fence in a Markdown document, with the
 * directives from its info string or from a `<!-- doc-example: ... -->`
 * comment on the nearest non-blank line above it.
 */
export function extractExamples(
  markdown: string,
  file: string,
): { examples: DocExample[]; problems: Problem[] } {
  const lines = markdown.split(/\r?\n/);
  const examples: DocExample[] = [];
  const problems: Problem[] = [];
  const perHeading = new Map<string, number>();
  let heading = '';
  let pending: { text: string; line: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i]!;

    const open = /^( {0,3})(`{3,}|~{3,})\s*([^\s`~]*)\s*(.*)$/.exec(text);
    if (open) {
      const [, indent, fence, lang, info] = open;
      const body: string[] = [];
      let j = i + 1;
      for (; j < lines.length; j++) {
        const close = lines[j]!.trim();
        if (close.startsWith(fence![0]!.repeat(fence!.length))) {
          if (close.replace(/[`~]/g, '') === '') break;
        }
        // Content indented with the fence (a list item) loses that indent.
        body.push(
          lines[j]!.startsWith(indent!)
            ? lines[j]!.slice(indent!.length)
            : lines[j]!,
        );
      }

      if (EXAMPLE_LANGUAGES.has(lang!.toLowerCase())) {
        const fromInfo = parseDirectives(info!);
        const fromComment = pending ? parseDirectives(pending.text) : null;
        const count = (perHeading.get(heading) ?? 0) + 1;
        perHeading.set(heading, count);

        let directives: Directives | null = null;
        if (typeof fromInfo === 'string') {
          problems.push({ file, line: i + 1, message: fromInfo });
        } else if (typeof fromComment === 'string') {
          problems.push({ file, line: pending!.line, message: fromComment });
        } else if (fromComment && fromInfo.mode !== 'check') {
          problems.push({
            file,
            line: i + 1,
            message:
              'directives in both the fence and a doc-example comment; use one',
          });
        } else {
          directives = fromComment ?? fromInfo;
        }

        if (directives) {
          const bead =
            directives.mode === 'no-check'
              ? BEAD.exec(directives.reason!)?.[0]
              : undefined;
          examples.push({
            file,
            heading,
            ordinal: count,
            line: i + 2,
            code: body.join('\n'),
            mode: directives.mode,
            ...(directives.reason ? { reason: directives.reason } : {}),
            ...(bead ? { bead } : {}),
          });
        }
      } else if (pending) {
        problems.push({
          file,
          line: pending.line,
          message: `doc-example comment is followed by a "${lang || 'plain'}" block, not ts/typescript`,
        });
      }
      pending = null;
      i = j;
      continue;
    }

    const comment = DIRECTIVE_COMMENT.exec(text);
    if (comment) {
      if (pending) {
        problems.push({
          file,
          line: pending.line,
          message: 'doc-example comment is not followed by a code block',
        });
      }
      pending = { text: comment[1]!, line: i + 1 };
      continue;
    }

    if (text.trim() === '') continue;

    if (pending) {
      problems.push({
        file,
        line: pending.line,
        message: 'doc-example comment is not followed by a code block',
      });
      pending = null;
    }
    const h = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(text);
    if (h) heading = h[1]!;
  }

  if (pending) {
    problems.push({
      file,
      line: pending.line,
      message: 'doc-example comment is not followed by a code block',
    });
  }
  return { examples, problems };
}

/** The Markdown files `DOC_SOURCES` names, relative and `/`-separated. */
export function listDocFiles(root: string = REPO_ROOT): string[] {
  const files: string[] = [];
  for (const source of DOC_SOURCES) {
    const full = path.join(root, source);
    if (!existsSync(full)) continue;
    if (source.endsWith('.md')) {
      files.push(source);
    } else {
      for (const name of readdirSync(full).sort()) {
        if (name.endsWith('.md')) files.push(`${source}/${name}`);
      }
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// Consumer workspace
// ---------------------------------------------------------------------------

export interface WorkspaceEntry {
  example: DocExample;
  /** Module path relative to the workspace, `/`-separated. */
  module: string;
}

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'top'
  );
}

/**
 * The module a block becomes. `export {}` makes every block an ES module, so
 * its own declarations shadow the prelude's globals instead of clashing with
 * them, and top-level `await` is allowed.
 */
export function moduleSource(example: DocExample): string {
  return `${example.code}\nexport {};\n`;
}

/**
 * Writes one `.mts` module per checked block, the prelude, and two tsconfig
 * files (nodenext and bundler resolution, strict, declarations of the
 * installed package checked too) into `dir`. The package itself must already
 * be installed in `dir/node_modules`.
 */
export function writeWorkspace(
  dir: string,
  examples: DocExample[],
  options: { prelude: string; typeRoots?: string[] },
): WorkspaceEntry[] {
  const examplesDir = path.join(dir, 'examples');
  mkdirSync(examplesDir, { recursive: true });
  const entries: WorkspaceEntry[] = [];
  examples
    .filter((e) => e.mode !== 'no-check')
    .forEach((example, index) => {
      const name = `${String(index + 1).padStart(3, '0')}-${slug(
        path.basename(example.file, '.md'),
      )}-${slug(example.heading)}.mts`;
      writeFileSync(path.join(examplesDir, name), moduleSource(example));
      entries.push({ example, module: `examples/${name}` });
    });

  cpSync(options.prelude, path.join(dir, 'prelude.d.ts'));

  const common = {
    target: 'es2022',
    strict: true,
    skipLibCheck: false,
    resolveJsonModule: true,
    types: ['node', 'jest'],
    ...(options.typeRoots ? { typeRoots: options.typeRoots } : {}),
  };
  writeFileSync(
    path.join(dir, 'tsconfig.docs.json'),
    JSON.stringify(
      {
        compilerOptions: {
          ...common,
          module: 'nodenext',
          moduleResolution: 'nodenext',
          rootDir: 'examples',
          outDir: 'out',
        },
        include: ['examples/**/*.mts', 'prelude.d.ts'],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(dir, 'tsconfig.docs.bundler.json'),
    JSON.stringify(
      {
        compilerOptions: {
          ...common,
          module: 'esnext',
          moduleResolution: 'bundler',
          noEmit: true,
        },
        include: ['examples/**/*.mts', 'prelude.d.ts'],
      },
      null,
      2,
    ),
  );
  return entries;
}

export interface Failure {
  /** Null when the diagnostic is outside any example (the prelude, say). */
  example: DocExample | null;
  line: number;
  message: string;
}

/**
 * Maps `tsc --pretty false` output back to the blocks. Module line N is
 * Markdown line `example.line + N - 1`.
 */
export function mapDiagnostics(
  output: string,
  entries: WorkspaceEntry[],
  config: string,
): Failure[] {
  const byModule = new Map(entries.map((e) => [e.module, e.example]));
  const failures: Failure[] = [];
  let last: Failure | null = null;
  for (const raw of output.split(/\r?\n/)) {
    const m = /^(.+?)\((\d+),(\d+)\): error (TS\d+: .*)$/.exec(raw);
    if (m) {
      const module = m[1]!.replace(/\\/g, '/');
      const example = byModule.get(module) ?? null;
      last = {
        example,
        line: example ? example.line + Number(m[2]) - 1 : Number(m[2]),
        message: `[${config}] ${example ? '' : `${module}: `}${m[4]}`,
      };
      failures.push(last);
    } else if (/^error TS\d+/.test(raw)) {
      last = { example: null, line: 0, message: `[${config}] ${raw}` };
      failures.push(last);
    } else if (last && raw.startsWith('  ')) {
      last.message += `\n${raw}`;
    }
  }
  return failures;
}

/**
 * Type-checks the workspace under nodenext (emitting `out/*.mjs` for the
 * runnable blocks) and under bundler resolution.
 *
 * tsc reports no type errors at all while any file has a syntax error, so a
 * block that does not parse would hide every other block's type errors,
 * including the negative fixtures'. Blocks with syntax errors are therefore
 * reported and dropped, and the check runs again without them.
 */
export function typeCheckWorkspace(
  dir: string,
  entries: WorkspaceEntry[],
  tsc: string,
): Failure[] {
  const failures: Failure[] = [];
  for (const [config, label] of [
    ['tsconfig.docs.json', 'nodenext'],
    ['tsconfig.docs.bundler.json', 'bundler'],
  ] as const) {
    const excluded = new Set<DocExample>();
    const pass = config.replace(/\.json$/, '.pass.json');
    for (;;) {
      writeFileSync(
        path.join(dir, pass),
        JSON.stringify({
          extends: `./${config}`,
          include: [],
          files: [
            ...entries
              .filter((e) => !excluded.has(e.example))
              .map((e) => e.module),
            'prelude.d.ts',
          ],
        }),
      );
      const result = spawnSync(
        process.execPath,
        [tsc, '-p', pass, '--pretty', 'false'],
        { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
      );
      const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
      const mapped = mapDiagnostics(output, entries, label);
      const unparsed = mapped.filter(
        (f) => f.example !== null && /\] TS1\d{3}:/.test(f.message),
      );
      if (unparsed.length > 0) {
        failures.push(...unparsed);
        for (const f of unparsed) excluded.add(f.example!);
        continue;
      }
      if (result.status !== 0 && mapped.length === 0) {
        mapped.push({
          example: null,
          line: 0,
          message: `[${label}] tsc exited ${result.status}\n${output}`,
        });
      }
      failures.push(...mapped);
      break;
    }
  }
  return failures;
}

/**
 * Runs an emitted runnable block with `fetch` replaced by the harness stub.
 * Returns null on success, otherwise the failure output.
 */
export function runExample(
  dir: string,
  entry: WorkspaceEntry,
  timeoutMs = 30_000,
): string | null {
  const emitted = entry.module
    .replace(/^examples\//, 'out/')
    .replace(/\.mts$/, '.mjs');
  const result = spawnSync(
    process.execPath,
    [path.join(dir, 'run-example.mjs'), emitted],
    { cwd: dir, encoding: 'utf8', timeout: timeoutMs },
  );
  if (result.status === 0) return null;
  const reason = result.error
    ? result.error.message
    : `exit ${result.status ?? result.signal}`;
  return `${reason}\n${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
}

/** Copies the fetch stub and runner that `runExample` uses into `dir`. */
export function copyRunner(dir: string, harness: string = HARNESS_DIR): void {
  for (const name of ['run-example.mjs', 'stub-fetch.mjs']) {
    cpSync(path.join(harness, name), path.join(dir, name));
  }
}

// ---------------------------------------------------------------------------
// Known-broken baseline
// ---------------------------------------------------------------------------

export interface Baseline {
  /** Keys (see `exampleKey`) of blocks skipped because they are broken. */
  knownBroken: string[];
}

export function loadBaseline(file: string = BASELINE_PATH): Baseline {
  if (!existsSync(file)) return { knownBroken: [] };
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<Baseline>;
  return { knownBroken: parsed.knownBroken ?? [] };
}

export interface BaseBaseline {
  ref: string;
  /** False when the ref predates the baseline file: this change adds it. */
  present: boolean;
  entries: Set<string>;
}

/**
 * The baseline as committed on the integration branch, or null when no ref
 * resolves (a shallow checkout without master fetched): the ratchet then
 * fails closed.
 */
export function loadBaseBaseline(
  file: string = BASELINE_PATH,
): BaseBaseline | null {
  const rel = path.relative(REPO_ROOT, file).split(path.sep).join('/');
  const refs = [process.env.SPEC_AUDIT_BASE_REF, 'origin/master', 'master']
    .filter((ref): ref is string => Boolean(ref))
    .filter((ref, i, all) => all.indexOf(ref) === i);
  const git = (args: string[]): string =>
    execFileSync('git', args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  for (const ref of refs) {
    try {
      git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    } catch {
      continue;
    }
    try {
      const parsed = JSON.parse(
        git(['show', `${ref}:${rel}`]),
      ) as Partial<Baseline>;
      return { ref, present: true, entries: new Set(parsed.knownBroken ?? []) };
    } catch {
      return { ref, present: false, entries: new Set() };
    }
  }
  return null;
}

export interface BaselineProblems {
  /** no-check blocks naming a bead that the baseline does not list. */
  unlisted: string[];
  /** Baseline entries with no matching no-check block naming a bead. */
  stale: string[];
  /** Entries absent from the integration branch's baseline: the list grew. */
  added: string[];
}

/**
 * The baseline only shrinks. A `no-check` whose reason names a bead is a
 * known-broken example and must be listed; a listed block that is fixed,
 * moved or deleted must leave the list; and no entry may appear that the
 * integration branch does not already have. With no base ref every entry
 * counts as added (fail closed); a base ref that predates the file accepts
 * the entries as the starting point.
 */
export function checkBaseline(
  examples: DocExample[],
  baseline: Baseline,
  base: BaseBaseline | null,
): BaselineProblems {
  const broken = new Set(
    examples.filter((e) => e.mode === 'no-check' && e.bead).map(exampleKey),
  );
  const listed = new Set(baseline.knownBroken);
  return {
    unlisted: [...broken].filter((key) => !listed.has(key)),
    stale: baseline.knownBroken.filter((key) => !broken.has(key)),
    added:
      base === null
        ? [...baseline.knownBroken]
        : base.present
          ? baseline.knownBroken.filter((key) => !base.entries.has(key))
          : [],
  };
}
