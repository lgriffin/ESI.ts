/**
 * The check behind npm run lint:cycles.
 *
 * Builds the runtime import graph of src/ and fails on any cycle. An edge is
 * any relative `import`, `export ... from`, side-effect import, `require()`
 * or dynamic `import()` that is not written as type-only (`import type`,
 * `export type`, or every named specifier marked `type`). An import TypeScript
 * would elide because its names are used only as types still counts: marking
 * it `import type` is how the author says it carries no runtime dependency.
 *
 * `lint:layers` stops imports pointing outward between layers; this catches
 * the cycles inside one layer, which it cannot see.
 */
import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import ts from 'typescript';

/** Repository-relative file → the repository-relative files it imports at runtime. */
export type ImportGraph = Map<string, string[]>;

function isTypeOnlyImport(node: ts.ImportDeclaration): boolean {
  const clause = node.importClause;
  if (!clause) return false; // `import './x'` runs the module.
  if (clause.phaseModifier === ts.SyntaxKind.TypeKeyword) return true;
  if (clause.name) return false; // a default import is a value
  const bindings = clause.namedBindings;
  if (!bindings) return false;
  if (ts.isNamespaceImport(bindings)) return false;
  return (
    bindings.elements.length > 0 && bindings.elements.every((e) => e.isTypeOnly)
  );
}

function isTypeOnlyExport(node: ts.ExportDeclaration): boolean {
  if (node.isTypeOnly) return true;
  const clause = node.exportClause;
  return (
    clause !== undefined &&
    ts.isNamedExports(clause) &&
    clause.elements.length > 0 &&
    clause.elements.every((e) => e.isTypeOnly)
  );
}

/** The relative specifiers a source file depends on at runtime. */
export function runtimeSpecifiers(fileName: string, text: string): string[] {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest);
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !isTypeOnlyImport(node)
    ) {
      found.push(node.moduleSpecifier.text);
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !isTypeOnlyExport(node)
    ) {
      found.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require')) &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0]!)
    ) {
      found.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found.filter((s) => s.startsWith('.'));
}

/** The repository-relative file a relative specifier names, or null. */
export function resolveSpecifier(
  root: string,
  fromFile: string,
  specifier: string,
  exists: (absolute: string) => boolean = existsSync,
): string | null {
  const base = path.resolve(root, path.dirname(fromFile), specifier);
  const candidates = [base, `${base}.ts`, path.join(base, 'index.ts')].filter(
    (c) => c.endsWith('.ts'),
  );
  const hit = candidates.find((c) => exists(c));
  return hit ? path.relative(root, hit).split(path.sep).join('/') : null;
}

export function buildGraph(
  root: string,
  files: string[],
  read: (file: string) => string = (f) =>
    readFileSync(path.join(root, f), 'utf-8'),
  exists?: (absolute: string) => boolean,
): ImportGraph {
  const graph: ImportGraph = new Map();
  for (const file of files) {
    const targets = runtimeSpecifiers(file, read(file))
      .map((s) => resolveSpecifier(root, file, s, exists))
      .filter((t): t is string => t !== null && t !== file);
    graph.set(file, [...new Set(targets)].sort());
  }
  return graph;
}

/**
 * Strongly connected components with more than one file (Tarjan), each sorted,
 * the list sorted by first file: every import cycle, once.
 */
export function findCycles(graph: ImportGraph): string[][] {
  let index = 0;
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const components: string[][] = [];

  const strongConnect = (node: string): void => {
    indices.set(node, index);
    lowlink.set(node, index);
    index += 1;
    stack.push(node);
    onStack.add(node);
    for (const next of graph.get(node) ?? []) {
      if (!indices.has(next)) {
        strongConnect(next);
        lowlink.set(node, Math.min(lowlink.get(node)!, lowlink.get(next)!));
      } else if (onStack.has(next)) {
        lowlink.set(node, Math.min(lowlink.get(node)!, indices.get(next)!));
      }
    }
    if (lowlink.get(node) === indices.get(node)) {
      const component: string[] = [];
      let member: string;
      do {
        member = stack.pop()!;
        onStack.delete(member);
        component.push(member);
      } while (member !== node);
      component.sort();
      if (component.length > 1) components.push(component);
    }
  };

  for (const node of [...graph.keys()].sort()) {
    if (!indices.has(node)) strongConnect(node);
  }
  return components.sort((a, b) => a[0]!.localeCompare(b[0]!));
}

/** One concrete loop through a component, for the report: a → b → … → a. */
export function cyclePath(graph: ImportGraph, component: string[]): string[] {
  const members = new Set(component);
  const start = component[0]!;
  const previous = new Map<string, string>();
  const queue = [start];
  const seen = new Set([start]);
  while (queue.length > 0) {
    const node = queue.shift()!;
    for (const next of graph.get(node) ?? []) {
      if (!members.has(next)) continue;
      if (next === start) {
        const loop = [node];
        while (loop[0] !== start) loop.unshift(previous.get(loop[0]!)!);
        return [...loop, start];
      }
      if (!seen.has(next)) {
        seen.add(next);
        previous.set(next, node);
        queue.push(next);
      }
    }
  }
  return [...component, start];
}
