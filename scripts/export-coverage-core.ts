/**
 * Export coverage: is every public export named by at least one test?
 *
 * Line and branch coverage only see code that something calls. A helper that
 * is exported, typed and documented but never exercised is invisible to
 * them, because nothing runs it. This check asks a different question of the
 * public surface: for every name a package entry point exports, does a test
 * file contain an identifier that resolves to it?
 *
 * Both sides go through the TypeScript checker rather than text search:
 *
 * - The surface is `checker.getExportsOfModule` on each `package.json`
 *   `exports` entry's source file, so `export *`, `export * as ns`, renamed
 *   and type-only re-exports are all followed to the declaration they name.
 * - A reference is an identifier in a test file whose symbol, after resolving
 *   import aliases, is that same declaration. A name in a comment or a string
 *   is not an identifier and never counts. Neither does an import on its own:
 *   `import { Foo }` with no later use of `Foo` is not a test of `Foo`.
 *
 * A class counts as referenced when the class itself is; its members are not
 * checked one by one (a possible later refinement).
 */

import { execFileSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

export interface EntryPoint {
  /** The `exports` key, e.g. `.` or `./errors`. */
  subpath: string;
  /** Absolute path of the TypeScript source the entry is built from. */
  source: string;
}

/**
 * The package's public entry points, read from `package.json` `exports`.
 *
 * Each entry's `types` condition (`./dist/<name>.d.ts`) maps back to
 * `src/<name>.ts`. When the project has a `tsup.config.ts`, its `entry` list
 * must name exactly the same sources: an entry point that is built but not
 * exported, or exported but not built, means the surface this check reads is
 * not the surface that ships, so it throws rather than guess.
 */
export function entryPointsFromPackage(root: string): EntryPoint[] {
  const pkg = JSON.parse(
    readFileSync(path.join(root, 'package.json'), 'utf-8'),
  ) as { exports?: Record<string, unknown> };
  if (!pkg.exports || typeof pkg.exports !== 'object') {
    throw new Error('package.json has no exports map.');
  }

  const entries: EntryPoint[] = [];
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    if (typeof target !== 'object' || target === null) continue; // ./package.json
    const types = (target as { types?: unknown }).types;
    const match =
      typeof types === 'string' ? /^\.\/dist\/(.+)\.d\.ts$/.exec(types) : null;
    if (!match) {
      throw new Error(
        `exports['${subpath}'].types must be ./dist/<name>.d.ts (got ${JSON.stringify(types)}).`,
      );
    }
    const source = path.join(root, 'src', `${match[1]}.ts`);
    if (!existsSync(source)) {
      throw new Error(
        `exports['${subpath}'] has no source file at ${toPosix(path.relative(root, source))}.`,
      );
    }
    entries.push({ subpath, source });
  }

  const tsupEntries = readTsupEntries(root);
  if (tsupEntries) {
    const exported = entries.map((e) => toPosix(path.relative(root, e.source)));
    const built = tsupEntries.map(toPosix);
    const notBuilt = exported.filter((file) => !built.includes(file));
    const notExported = built.filter((file) => !exported.includes(file));
    if (notBuilt.length > 0 || notExported.length > 0) {
      throw new Error(
        'package.json exports and tsup.config.ts entry disagree: ' +
          `exported but not built [${notBuilt.join(', ')}], ` +
          `built but not exported [${notExported.join(', ')}].`,
      );
    }
  }
  return entries;
}

/** String literals in `tsup.config.ts`'s `entry` array, or null without one. */
function readTsupEntries(root: string): string[] | null {
  const configPath = path.join(root, 'tsup.config.ts');
  if (!existsSync(configPath)) return null;
  const source = ts.createSourceFile(
    configPath,
    readFileSync(configPath, 'utf-8'),
    ts.ScriptTarget.Latest,
  );
  let found: string[] | null = null;
  const visit = (node: ts.Node): void => {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'entry' &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      found = node.initializer.elements
        .filter(ts.isStringLiteralLike)
        .map((element) => element.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!found) {
    throw new Error('tsup.config.ts has no entry array this check can read.');
  }
  return found;
}

// ---------------------------------------------------------------------------
// Test files
// ---------------------------------------------------------------------------

/**
 * Directories under `tests/` whose files are inputs to other checks, not
 * tests of the library: a fixture that names an export proves nothing about it.
 */
const EXCLUDED_DIRS = new Set([
  'node_modules',
  'fixtures',
  'step-fixtures',
  'snapshots',
  '__snapshots__',
]);

const TEST_FILE = /\.(ts|tsx|mts|cts)$/;

/** Every TypeScript file under `<root>/tests`, minus fixtures and snapshots. */
export function collectTestFiles(root: string): string[] {
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) walk(abs);
      } else if (TEST_FILE.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        files.push(abs);
      }
    }
  };
  const testsDir = path.join(root, 'tests');
  if (existsSync(testsDir)) walk(testsDir);
  return files.sort();
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export interface EntryCoverage {
  subpath: string;
  /** Every exported name, sorted. */
  exported: string[];
  /** Exported names no test file references, sorted. */
  unreferenced: string[];
}

export interface ExportCoverageReport {
  entries: EntryCoverage[];
  testFileCount: number;
}

export interface AnalyseOptions {
  root: string;
  entries: EntryPoint[];
  testFiles: string[];
  /**
   * The package name, so tests that import `<name>` or `<name>/<subpath>`
   * (the consumer contract tests) resolve to the entry's source.
   */
  packageName?: string;
}

export function analyseExportCoverage(
  options: AnalyseOptions,
): ExportCoverageReport {
  const { entries, testFiles, packageName } = options;

  const paths: Record<string, string[]> = {};
  if (packageName) {
    for (const entry of entries) {
      const specifier =
        entry.subpath === '.'
          ? packageName
          : `${packageName}/${entry.subpath.replace(/^\.\//, '')}`;
      paths[specifier] = [entry.source];
    }
  }

  const program = ts.createProgram({
    rootNames: [...entries.map((e) => e.source), ...testFiles],
    options: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      allowJs: false,
      resolveJsonModule: true,
      esModuleInterop: true,
      skipLibCheck: true,
      noEmit: true,
      // Ambient globals (jest, node) cannot resolve to a package export, and
      // loading them is most of a program's start-up cost.
      types: [],
      paths,
    },
  });
  const checker = program.getTypeChecker();

  /** One identity per declaration, however it was reached. */
  const canonical = (symbol: ts.Symbol): ts.Symbol => {
    let resolved = symbol;
    if (resolved.flags & ts.SymbolFlags.Alias) {
      resolved = checker.getAliasedSymbol(resolved);
    }
    return checker.getExportSymbolOfSymbol(resolved);
  };

  // The surface, per entry point.
  const surface = entries.map((entry) => {
    const sourceFile = program.getSourceFile(entry.source);
    const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
    if (!moduleSymbol) {
      throw new Error(`Could not load entry point ${entry.source}.`);
    }
    const exports = checker
      .getExportsOfModule(moduleSymbol)
      .map((symbol) => ({ name: symbol.name, target: canonical(symbol) }));
    return { entry, exports };
  });

  const exportedNames = new Set(
    surface.flatMap(({ exports }) => exports.map((e) => e.name)),
  );

  // Resolving an identifier can type-check the expression around it, so only
  // identifiers that could possibly name an export are resolved: an exported
  // name, or a local name some test binds with an import or re-export
  // (`import { Foo as Bar }`, `import * as esi`). The answer for each one
  // still comes from the checker.
  const candidateNames = new Set(exportedNames);
  const testSources = testFiles.map((file) => {
    const sourceFile = program.getSourceFile(file);
    if (!sourceFile) throw new Error(`Could not load test file ${file}.`);
    return sourceFile;
  });
  for (const sourceFile of testSources) {
    collectBindingNames(sourceFile, candidateNames);
  }

  const referenced = new Set<ts.Symbol>();
  const record = (symbol: ts.Symbol | undefined): void => {
    if (symbol) referenced.add(canonical(symbol));
  };

  const visit = (node: ts.Node): void => {
    // An import or re-export on its own is not a use of the name.
    if (
      ts.isImportDeclaration(node) ||
      ts.isImportEqualsDeclaration(node) ||
      ts.isExportDeclaration(node)
    ) {
      return;
    }
    if (ts.isIdentifier(node) && candidateNames.has(node.text)) {
      const parent = node.parent;
      if (ts.isShorthandPropertyAssignment(parent) && parent.name === node) {
        record(checker.getShorthandAssignmentValueSymbol(parent));
      } else if (
        ts.isBindingElement(parent) &&
        ts.isObjectBindingPattern(parent.parent) &&
        (parent.propertyName ?? parent.name) === node
      ) {
        // `const { Foo } = await import('../src')`
        const property = checker
          .getTypeAtLocation(parent.parent)
          .getProperty(node.text);
        record(property);
      } else {
        record(checker.getSymbolAtLocation(node));
      }
    }
    ts.forEachChild(node, visit);
  };
  for (const sourceFile of testSources) visit(sourceFile);

  return {
    testFileCount: testFiles.length,
    entries: surface.map(({ entry, exports }) => ({
      subpath: entry.subpath,
      exported: exports.map((e) => e.name).sort(),
      unreferenced: exports
        .filter((e) => !referenced.has(e.target))
        .map((e) => e.name)
        .sort(),
    })),
  };
}

/** Local names bound by import and export declarations in a file. */
function collectBindingNames(sourceFile: ts.SourceFile, into: Set<string>) {
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && statement.importClause) {
      const clause = statement.importClause;
      if (clause.name) into.add(clause.name.text);
      const bindings = clause.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) {
        into.add(bindings.name.text);
      } else if (bindings) {
        for (const element of bindings.elements) into.add(element.name.text);
      }
    } else if (ts.isImportEqualsDeclaration(statement)) {
      into.add(statement.name.text);
    } else if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        into.add(element.name.text);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Baseline ratchet
// ---------------------------------------------------------------------------

/** Unreferenced exports that are known and tolerated, by entry subpath. */
export type ExportBaseline = Record<string, string[]>;

export const BASELINE_FILE = 'scripts/export-coverage-baseline.json';

/** Parse and validate a baseline file. Throws on anything malformed. */
export function parseBaseline(raw: string): ExportBaseline {
  const parsed = JSON.parse(raw) as { unreferenced?: unknown };
  const section = parsed.unreferenced ?? {};
  if (
    typeof section !== 'object' ||
    section === null ||
    Array.isArray(section)
  ) {
    throw new Error(
      "Baseline 'unreferenced' must be an object of entry → export names.",
    );
  }
  const baseline: ExportBaseline = {};
  for (const [subpath, names] of Object.entries(section)) {
    if (!Array.isArray(names) || names.some((n) => typeof n !== 'string')) {
      throw new Error(
        `Baseline entry '${subpath}' must be an array of export names.`,
      );
    }
    baseline[subpath] = names as string[];
  }
  return baseline;
}

/** Serialise with sorted keys and names, so a regenerated file diffs cleanly. */
export function serializeBaseline(report: ExportCoverageReport): string {
  const unreferenced: ExportBaseline = {};
  for (const entry of [...report.entries].sort((a, b) =>
    a.subpath.localeCompare(b.subpath),
  )) {
    if (entry.unreferenced.length > 0) {
      unreferenced[entry.subpath] = [...entry.unreferenced];
    }
  }
  return `${JSON.stringify(
    {
      $comment:
        'Public exports no test references yet. Shrink-only: CI fails on an ' +
        'unreferenced export missing from this list, on an entry that is now ' +
        'referenced or no longer exported, and on any entry not on master. ' +
        'Regenerate with npm run test:export-coverage -- --write-baseline.',
      unreferenced,
    },
    null,
    2,
  )}\n`;
}

/**
 * The baseline as it stands on the integration branch.
 *
 * `ref: null` means no base ref resolved (a shallow checkout, no git): every
 * entry then reads as an addition, which fails closed. `baseline: null` with a
 * ref means the ref resolved but has no baseline file yet — the one state in
 * which additions cannot be told apart from the file being introduced.
 */
export interface BaseBaseline {
  ref: string | null;
  baseline: ExportBaseline | null;
}

export function loadBaseBaseline(root: string, refs: string[]): BaseBaseline {
  const git = (args: string[]) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

  for (const ref of refs) {
    try {
      git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    } catch {
      continue; // Ref not available in this checkout; try the next one.
    }
    let raw: string;
    try {
      // `./` makes the path relative to `root`, wherever the repository is.
      raw = git(['show', `${ref}:./${BASELINE_FILE}`]);
    } catch {
      return { ref, baseline: null }; // The ref predates the baseline file.
    }
    try {
      return { ref, baseline: parseBaseline(raw) };
    } catch {
      // An unreadable base copy cannot vouch for any entry: fail closed.
      return { ref, baseline: {} };
    }
  }
  return { ref: null, baseline: null };
}

export interface RatchetResult {
  /** Unreferenced exports the baseline does not list: write a test. */
  unlisted: string[];
  /** Baseline entries now referenced or no longer exported: remove them. */
  stale: string[];
  /** Baseline entries absent from the base ref's baseline: the list grew. */
  added: string[];
  /** Set when no base ref resolved, so every entry counts as added. */
  baseRefMissing: boolean;
}

const key = (subpath: string, name: string) => `${subpath} ${name}`;

export function applyBaseline(
  report: ExportCoverageReport,
  baseline: ExportBaseline,
  base: BaseBaseline,
): RatchetResult {
  const listed = new Set(
    Object.entries(baseline).flatMap(([subpath, names]) =>
      names.map((name) => key(subpath, name)),
    ),
  );
  const unreferenced = new Set(
    report.entries.flatMap((entry) =>
      entry.unreferenced.map((name) => key(entry.subpath, name)),
    ),
  );

  const unlisted = [...unreferenced].filter((k) => !listed.has(k));
  const stale = [...listed].filter((k) => !unreferenced.has(k));

  const added: string[] = [];
  if (base.ref === null || base.baseline !== null) {
    const before = new Set(
      Object.entries(base.baseline ?? {}).flatMap(([subpath, names]) =>
        names.map((name) => key(subpath, name)),
      ),
    );
    added.push(...[...listed].filter((k) => !before.has(k)));
  }

  return { unlisted, stale, added, baseRefMissing: base.ref === null };
}

export function ratchetProblems(result: RatchetResult): string[] {
  const problems: string[] = [];
  if (result.unlisted.length > 0) {
    problems.push(
      `${result.unlisted.length} public exports are referenced by no test and are not in the baseline: ` +
        `${result.unlisted.join(', ')}. Add a test that uses each one.`,
    );
  }
  if (result.stale.length > 0) {
    problems.push(
      `${result.stale.length} baseline entries are now referenced by a test or no longer exported: ` +
        `${result.stale.join(', ')}. Remove them from ${BASELINE_FILE} to lock the improvement in.`,
    );
  }
  if (result.added.length > 0) {
    problems.push(
      result.baseRefMissing
        ? `No base ref resolved, so the ${result.added.length} baseline entries cannot be shown not to be new. ` +
            'Fetch master or set EXPORT_COVERAGE_BASE_REF.'
        : `${result.added.length} baseline entries are not on the base branch: ${result.added.join(', ')}. ` +
            'The baseline only shrinks; test the export instead.',
    );
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/** The check itself is broken: it found no exports or no tests to read. */
export const EXIT_INTEGRITY = 2;
/** `--ci` and the ratchet failed. */
export const EXIT_RATCHET = 1;

export function integrityProblems(report: ExportCoverageReport): string[] {
  const problems: string[] = [];
  if (report.testFileCount === 0) problems.push('No test files were found.');
  for (const entry of report.entries) {
    if (entry.exported.length === 0) {
      problems.push(`Entry point '${entry.subpath}' exports nothing.`);
    }
  }
  return problems;
}

export function renderReport(report: ExportCoverageReport): string {
  const lines: string[] = [];
  for (const entry of report.entries) {
    const covered = entry.exported.length - entry.unreferenced.length;
    lines.push(
      `${entry.subpath}: ${covered}/${entry.exported.length} exports referenced by a test, ` +
        `${entry.unreferenced.length} unreferenced`,
    );
    for (const name of entry.unreferenced) lines.push(`  - ${name}`);
  }
  return lines.join('\n');
}

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}
