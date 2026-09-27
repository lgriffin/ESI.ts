/**
 * `isolatedDeclarations` for the layers 11.0 exposes.
 *
 * The flag demands an explicit type on every export whose type would
 * otherwise be inferred. That is right for the pipeline, the ports, the
 * generated operations, the client runtime, auth and the entry points, whose
 * declarations consumers read. It is wrong for the hand-written Zod schemas
 * and the endpoint maps: their exported types are inferred by design (a
 * schema's type is the schema; an endpoint map's per-key literal types drive
 * the inferred return type of every client method), and writing those types
 * by hand would flatten them.
 *
 * So the flag is checked over the files tsconfig.isolated.json includes, and
 * only those. The program still reads the schemas and endpoint maps the
 * included files import, but their diagnostics are not reported here: the
 * ordinary `typecheck` covers them. Exit 1 on any diagnostic in an included
 * file. Phase 3 item 4 of guides/ROADMAP.md.
 */
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const configPath = path.join(root, 'tsconfig.isolated.json');
const read = ts.readConfigFile(configPath, ts.sys.readFile);
if (read.error) {
  console.error(ts.flattenDiagnosticMessageText(read.error.messageText, '\n'));
  process.exit(2);
}
const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, root);
const format = (diagnostics: readonly ts.Diagnostic[]): string =>
  ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (file) => file,
    getCurrentDirectory: () => root,
    getNewLine: () => '\n',
  });

// A config that fails to parse, or an include pattern that matches nothing,
// would otherwise pass as "no diagnostics in no files".
if (parsed.errors.length > 0) {
  console.error(format(parsed.errors));
  process.exit(2);
}
const inScope = new Set(parsed.fileNames.map((file) => path.resolve(file)));
if (inScope.size === 0) {
  console.error(
    'isolatedDeclarations: tsconfig.isolated.json includes no files.',
  );
  process.exit(2);
}

const program = ts.createProgram({
  rootNames: parsed.fileNames,
  options: parsed.options,
});
// Diagnostics with no file are the compiler's own (an option conflict, a
// missing lib) and always count; file diagnostics count inside the scope.
const reported = ts
  .getPreEmitDiagnostics(program)
  .filter(
    (diagnostic) =>
      diagnostic.file === undefined ||
      inScope.has(path.resolve(diagnostic.file.fileName)),
  );

if (reported.length > 0) {
  console.error(format(reported));
  console.error(
    `isolatedDeclarations: ${reported.length} diagnostic(s) in ${inScope.size} checked files.`,
  );
  process.exit(1);
}
console.log(
  `isolatedDeclarations holds for ${inScope.size} files (tsconfig.isolated.json).`,
);
