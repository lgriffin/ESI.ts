/**
 * Runs the type mutation: builds workspaces, applies one mutant at a time to
 * a copy of the declaration output and runs tsd against it.
 *
 * The repository's tsd tests import from `src/`, so a workspace copies the
 * type tests with those imports pointed at the copied declarations instead.
 * The workspace sits inside the package root so `tsd`, `zod` and the rest
 * still resolve from its `node_modules`, and tsd still finds the package's
 * tsconfig.json by walking up.
 *
 * With more than one worker, each worker is a forked copy of this file with
 * its own workspace, so mutants never see each other's edits.
 */
import { ChildProcess, fork } from 'child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs';
import * as path from 'path';
import tsd from 'tsd';
import * as ts from 'typescript';
import {
  EntryPoint,
  Mutant,
  MutantResult,
  TsdDiagnostic,
  applyMutant,
  classify,
  entryPointsOf,
  generateMutants,
  sampleMutants,
} from './type-mutation-core';

export interface TypeMutationOptions {
  /** Directory holding package.json. */
  packageRoot: string;
  /** Declaration output, relative to the package root (`dist`). */
  declarationDir: string;
  /** Type test files, relative to the package root. */
  testFiles: string[];
  /** Rewrites `../src` style imports in the tests to the declaration dir. */
  rewriteImportsFrom?: string;
  /** Copy the package's tsconfig.json into each workspace. */
  copyTsconfig?: boolean;
  /** Scratch directory for workspaces; removed afterwards. */
  workDir: string;
  maxMutants: number;
  seed: number;
  workers: number;
  onProgress?: (done: number, total: number, result: MutantResult) => void;
}

export interface TypeMutationRun {
  entryPoints: EntryPoint[];
  /** Candidate mutants per entry point, before sampling. */
  candidates: Record<string, number>;
  totalCandidates: number;
  results: MutantResult[];
}

// ---------------------------------------------------------------------------
// Workspaces
// ---------------------------------------------------------------------------

function listDeclarationFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listDeclarationFiles(full));
    else if (entry.name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

export function rewriteImports(
  source: string,
  from: string,
  to: string,
): string {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.replace(
    new RegExp(`(['"])((?:\\.\\.?/)+)${escaped}(?=['"/])`, 'g'),
    `$1$2${to}`,
  );
}

/**
 * A generated type test that only imports every entry point. tsd builds its
 * program from the test files, so without it a mutant in declarations no
 * test imports could break them and still be scored as surviving rather
 * than invalid.
 */
const ENTRY_POINTS_TEST = 'type-mutation-entry-points.test-d.ts';

function entryPointsTest(
  options: TypeMutationOptions,
  entryPoints: EntryPoint[],
): string {
  return entryPoints
    .map((e, i) => {
      const rel = path
        .relative(options.packageRoot, e.typesFile)
        .split(path.sep)
        .join('/')
        .replace(/\.d\.ts$/, '');
      return `import type * as entry${i} from './${rel}';\nexport type { entry${i} };\n`;
    })
    .join('');
}

function createWorkspace(
  options: TypeMutationOptions,
  dir: string,
  entryPoints: EntryPoint[],
): void {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const { packageRoot, declarationDir } = options;
  cpSync(
    path.join(packageRoot, 'package.json'),
    path.join(dir, 'package.json'),
  );
  const sourceDecl = path.join(packageRoot, declarationDir);
  for (const file of listDeclarationFiles(sourceDecl)) {
    const target = path.join(
      dir,
      declarationDir,
      path.relative(sourceDecl, file),
    );
    mkdirSync(path.dirname(target), { recursive: true });
    cpSync(file, target);
  }
  for (const test of options.testFiles) {
    const target = path.join(dir, test);
    mkdirSync(path.dirname(target), { recursive: true });
    let source = readFileSync(path.join(packageRoot, test), 'utf8');
    if (options.rewriteImportsFrom) {
      source = rewriteImports(
        source,
        options.rewriteImportsFrom,
        declarationDir,
      );
      if (rewriteImports(source, options.rewriteImportsFrom, 'x') !== source) {
        throw new Error(`Unrewritten import in ${test}`);
      }
    }
    writeFileSync(target, source);
  }
  writeFileSync(
    path.join(dir, ENTRY_POINTS_TEST),
    entryPointsTest(options, entryPoints),
  );
  // The repository's own tsconfig is found by tsd walking up from the
  // workspace; its relative typeRoots only resolve from the root, so it is
  // never copied. A self-contained package (the unit-test fixture) opts in.
  if (options.copyTsconfig) {
    cpSync(
      path.join(packageRoot, 'tsconfig.json'),
      path.join(dir, 'tsconfig.json'),
    );
  }
}

// ---------------------------------------------------------------------------
// Running tsd
// ---------------------------------------------------------------------------

async function runTsd(
  workspace: string,
  testFiles: string[],
): Promise<TsdDiagnostic[]> {
  const diagnostics = await tsd({
    cwd: workspace,
    testFiles: testFiles.map((f) => f.split(path.sep).join('/')),
  });
  return diagnostics.map((d) => ({
    fileName: d.fileName,
    message: d.message,
    line: d.line,
    column: d.column,
  }));
}

async function runMutantIn(
  workspace: string,
  testFiles: string[],
  mutant: Mutant,
): Promise<TsdDiagnostic[]> {
  const file = path.join(workspace, mutant.file);
  const original = readFileSync(file, 'utf8');
  writeFileSync(file, applyMutant(original, mutant));
  try {
    return await runTsd(workspace, testFiles);
  } finally {
    writeFileSync(file, original);
  }
}

function toResult(
  mutant: Mutant,
  diagnostics: TsdDiagnostic[],
  declarationRoot: string,
): MutantResult {
  const isDecl = (f: string): boolean => {
    const rel = path.relative(declarationRoot, path.resolve(f));
    return !rel.startsWith('..') && !path.isAbsolute(rel);
  };
  const status = classify(diagnostics, isDecl);
  const first = diagnostics.find((d) =>
    status === 'Invalid' ? isDecl(d.fileName) : true,
  );
  return {
    ...mutant,
    status,
    ...(first
      ? {
          reason: `${path.basename(first.fileName)}:${first.line ?? '?'}: ${first.message.split('\n')[0]}`,
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export function findMutants(options: TypeMutationOptions): {
  entryPoints: EntryPoint[];
  mutants: Mutant[];
} {
  const pkg = JSON.parse(
    readFileSync(path.join(options.packageRoot, 'package.json'), 'utf8'),
  ) as Parameters<typeof entryPointsOf>[0];
  const entryPoints = entryPointsOf(pkg, options.packageRoot);
  for (const e of entryPoints) {
    if (!existsSync(e.typesFile)) {
      throw new Error(
        `${e.name}: ${path.relative(options.packageRoot, e.typesFile)} does not exist. Run npm run build first.`,
      );
    }
  }
  const program = ts.createProgram(
    entryPoints.map((e) => e.typesFile),
    {
      noEmit: true,
      skipLibCheck: true,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
      types: [],
    },
  );
  const mutants = generateMutants(
    program,
    entryPoints,
    options.packageRoot,
    path.resolve(options.packageRoot, options.declarationDir),
  );
  return { entryPoints, mutants };
}

interface WorkerResultMessage {
  kind: 'result';
  id: string;
  diagnostics: TsdDiagnostic[];
}
interface WorkerErrorMessage {
  kind: 'error';
  message: string;
}

export async function runTypeMutation(
  options: TypeMutationOptions,
): Promise<TypeMutationRun> {
  const { entryPoints, mutants } = findMutants(options);
  const names = entryPoints.map((e) => e.name);
  const candidates = Object.fromEntries(
    names.map((n) => [
      n,
      mutants.filter((m) => m.entryPoints.includes(n)).length,
    ]),
  );
  const selected = sampleMutants(
    mutants,
    names,
    options.maxMutants,
    options.seed,
  );

  const workers = Math.max(1, Math.min(options.workers, selected.length || 1));
  const workspaces = Array.from({ length: workers }, (_, i) =>
    path.join(options.workDir, `w${i}`),
  );
  for (const ws of workspaces) createWorkspace(options, ws, entryPoints);
  const testFiles = [...options.testFiles, ENTRY_POINTS_TEST];

  try {
    const baseline = await runTsd(workspaces[0] as string, testFiles);
    if (baseline.length > 0) {
      const detail = baseline
        .slice(0, 10)
        .map((d) => `  ${d.fileName}:${d.line ?? '?'} ${d.message}`)
        .join('\n');
      throw new Error(
        `The type tests fail against the unmutated declarations, so no mutant can be scored:\n${detail}`,
      );
    }

    const results: MutantResult[] = [];
    const record = (
      mutant: Mutant,
      diagnostics: TsdDiagnostic[],
      ws: string,
    ): void => {
      const result = toResult(
        mutant,
        diagnostics,
        path.join(ws, options.declarationDir),
      );
      results.push(result);
      options.onProgress?.(results.length, selected.length, result);
    };

    if (workers === 1) {
      const ws = workspaces[0] as string;
      for (const mutant of selected) {
        record(mutant, await runMutantIn(ws, testFiles, mutant), ws);
      }
    } else {
      await runForked(selected, workspaces, testFiles, record);
    }

    const order = new Map(selected.map((m, i) => [m.id, i]));
    results.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return {
      entryPoints,
      candidates,
      totalCandidates: mutants.length,
      results,
    };
  } finally {
    rmSync(options.workDir, { recursive: true, force: true });
  }
}

function runForked(
  selected: Mutant[],
  workspaces: string[],
  testFiles: string[],
  record: (mutant: Mutant, diagnostics: TsdDiagnostic[], ws: string) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const queue = [...selected];
    const byId = new Map(selected.map((m) => [m.id, m]));
    const children: ChildProcess[] = [];
    let remaining = selected.length;
    let failed = false;

    const fail = (err: Error): void => {
      if (failed) return;
      failed = true;
      for (const c of children) c.kill();
      reject(err);
    };

    const dispatch = (child: ChildProcess): void => {
      // An idle worker waits; all are told to exit once every result is in.
      const next = queue.shift();
      if (next) child.send({ kind: 'run', mutant: next });
    };

    if (remaining === 0) {
      resolve();
      return;
    }

    for (const ws of workspaces) {
      const child = fork(
        __filename,
        ['--type-mutation-worker', ws, ...testFiles],
        {
          execArgv: __filename.endsWith('.ts')
            ? ['-r', 'ts-node/register/transpile-only']
            : [],
          stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
        },
      );
      children.push(child);
      child.on('message', (msg: WorkerResultMessage | WorkerErrorMessage) => {
        if (msg.kind === 'error') {
          fail(new Error(`Worker failed: ${msg.message}`));
          return;
        }
        const mutant = byId.get(msg.id);
        if (mutant) record(mutant, msg.diagnostics, ws);
        remaining -= 1;
        if (remaining === 0) {
          for (const c of children) c.send({ kind: 'exit' });
          resolve();
          return;
        }
        dispatch(child);
      });
      child.on('exit', (code) => {
        if (remaining > 0 && !failed) {
          fail(new Error(`Worker for ${ws} exited with code ${code}`));
        }
      });
      dispatch(child);
    }
  });
}

// ---------------------------------------------------------------------------
// Worker mode
// ---------------------------------------------------------------------------

function workerMain(): void {
  const index = process.argv.indexOf('--type-mutation-worker');
  const workspace = process.argv[index + 1] as string;
  const testFiles = process.argv.slice(index + 2);
  process.on(
    'message',
    (msg: { kind: 'run'; mutant: Mutant } | { kind: 'exit' }) => {
      if (msg.kind === 'exit') {
        process.exit(0);
      }
      runMutantIn(workspace, testFiles, msg.mutant)
        .then((diagnostics) =>
          process.send?.({ kind: 'result', id: msg.mutant.id, diagnostics }),
        )
        .catch((err: unknown) =>
          process.send?.({
            kind: 'error',
            message: err instanceof Error ? err.message : String(err),
          }),
        );
    },
  );
}

if (process.argv.includes('--type-mutation-worker')) {
  workerMain();
}
