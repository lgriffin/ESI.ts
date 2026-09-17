/**
 * Type mutation: the type-level equivalent of Stryker.
 *
 * Stryker asks whether the unit suite notices a broken line of JavaScript.
 * This asks whether the tsd suite notices a broken line of the shipped
 * declarations: each mutant is one deliberate edit to `dist/**\/*.d.ts` (a
 * return type widened to `unknown`, a `readonly` dropped, an optional made
 * required, ...). A mutant the tsd suite still passes against is a promise in
 * the public types that no type test pins down.
 *
 * This module finds and describes mutants, samples them, classifies tsd
 * results and applies the per-entry-point ratchet. It reads source text but
 * runs nothing; `type-mutation-run.ts` owns workspaces and tsd.
 */
import * as path from 'path';
import * as ts from 'typescript';

export type MutationOperator =
  | 'return-unknown'
  | 'drop-readonly'
  | 'optional-to-required'
  | 'required-to-optional'
  | 'union-drop-member'
  | 'widen-literal'
  | 'remove-overload'
  | 'constraint-unknown';

export interface Mutant {
  /**
   * Stable across unrelated edits: built from the file, symbol path, operator
   * and the mutated text, never from byte offsets, so adding an export
   * elsewhere does not reshuffle the sample.
   */
  id: string;
  /** Posix path relative to the package root, e.g. `dist/core/util/error.d.ts`. */
  file: string;
  line: number;
  /** Dotted path to the mutated member, e.g. `EsiError.statusCode`. */
  symbol: string;
  operator: MutationOperator;
  start: number;
  end: number;
  replacement: string;
  before: string;
  after: string;
  /** `exports` keys that reach the mutated declaration, e.g. `.`, `./errors`. */
  entryPoints: string[];
}

export type MutantStatus = 'Killed' | 'Survived' | 'Invalid';

export interface EntryPoint {
  /** The `exports` key: `.`, `./schemas`, ... */
  name: string;
  /** Absolute path to the entry's `types` file. */
  typesFile: string;
}

// ---------------------------------------------------------------------------
// Entry points and public surface
// ---------------------------------------------------------------------------

interface PackageJson {
  types?: string;
  exports?: Record<string, unknown> | string;
}

/** Every `exports` entry with a `types` condition, in declaration order. */
export function entryPointsOf(
  pkg: PackageJson,
  packageRoot: string,
): EntryPoint[] {
  const entries: EntryPoint[] = [];
  if (pkg.exports && typeof pkg.exports === 'object') {
    for (const [name, target] of Object.entries(pkg.exports)) {
      if (target && typeof target === 'object' && 'types' in target) {
        const types = (target as { types?: unknown }).types;
        if (typeof types === 'string') {
          entries.push({ name, typesFile: path.resolve(packageRoot, types) });
        }
      }
    }
  }
  if (entries.length === 0 && pkg.types) {
    entries.push({
      name: '.',
      typesFile: path.resolve(packageRoot, pkg.types),
    });
  }
  return entries;
}

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

function isUnder(file: string, dir: string): boolean {
  const rel = path.relative(dir, file);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

/**
 * The declarations each entry point exports, keyed by node. Aliases are
 * followed, `export * as ns` namespaces are walked, and only declarations in
 * `declarationDir` count, so nothing from `zod` or `pino` is mutated.
 */
export function collectPublicDeclarations(
  program: ts.Program,
  entryPoints: EntryPoint[],
  declarationDir: string,
): Map<ts.Node, Set<string>> {
  const checker = program.getTypeChecker();
  const reached = new Map<ts.Node, Set<string>>();

  const visitModule = (
    moduleSymbol: ts.Symbol,
    entry: string,
    seen: Set<ts.Symbol>,
  ): void => {
    if (seen.has(moduleSymbol)) return;
    seen.add(moduleSymbol);
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      const target =
        exported.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(exported)
          : exported;
      for (const decl of target.declarations ?? []) {
        if (ts.isSourceFile(decl)) {
          visitModule(target, entry, seen);
          continue;
        }
        const file = decl.getSourceFile().fileName;
        if (!isUnder(path.resolve(file), declarationDir)) continue;
        const set = reached.get(decl) ?? new Set<string>();
        set.add(entry);
        reached.set(decl, set);
      }
    }
  };

  for (const entry of entryPoints) {
    const sf = program.getSourceFile(toPosix(entry.typesFile));
    const moduleSymbol = sf && checker.getSymbolAtLocation(sf);
    if (!moduleSymbol) {
      throw new Error(
        `No module found for ${entry.name} at ${entry.typesFile}`,
      );
    }
    visitModule(moduleSymbol, entry.name, new Set());
  }
  return reached;
}

// ---------------------------------------------------------------------------
// Mutant generation
// ---------------------------------------------------------------------------

interface RawMutant {
  node: ts.Node;
  operator: MutationOperator;
  start: number;
  end: number;
  replacement: string;
}

function nameText(name: ts.Node | undefined): string | undefined {
  if (!name) return undefined;
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return name.getText();
}

/** `Outer.member.(param)` for the node, from the nearest named ancestors. */
export function symbolPathOf(node: ts.Node): string {
  const parts: string[] = [];
  for (let n: ts.Node | undefined = node; n; n = n.parent) {
    if (ts.isSourceFile(n)) break;
    if (ts.isParameter(n)) {
      parts.push(`(${nameText(n.name) ?? '?'})`);
    } else if (ts.isTypeParameterDeclaration(n)) {
      parts.push(`<${n.name.text}>`);
    } else if (
      ts.isInterfaceDeclaration(n) ||
      ts.isClassDeclaration(n) ||
      ts.isTypeAliasDeclaration(n) ||
      ts.isFunctionDeclaration(n) ||
      ts.isEnumDeclaration(n) ||
      ts.isModuleDeclaration(n) ||
      ts.isVariableDeclaration(n) ||
      ts.isPropertySignature(n) ||
      ts.isPropertyDeclaration(n) ||
      ts.isMethodSignature(n) ||
      ts.isMethodDeclaration(n) ||
      ts.isGetAccessorDeclaration(n) ||
      ts.isSetAccessorDeclaration(n) ||
      ts.isEnumMember(n)
    ) {
      const name = nameText(n.name);
      if (name) parts.push(name);
    } else if (ts.isCallSignatureDeclaration(n)) {
      parts.push('()');
    } else if (ts.isConstructSignatureDeclaration(n)) {
      parts.push('new()');
    }
  }
  return parts.reverse().join('.').replace(/\.\(/g, '(').replace(/\.</g, '<');
}

const KEYWORD_TYPES_NOT_WORTH_WIDENING = new Set([
  ts.SyntaxKind.UnknownKeyword,
  ts.SyntaxKind.AnyKeyword,
]);

function hasReturnType(
  node: ts.Node,
): node is ts.SignatureDeclaration & { type: ts.TypeNode } {
  return (
    (ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isMethodSignature(node) ||
      ts.isCallSignatureDeclaration(node) ||
      ts.isConstructSignatureDeclaration(node) ||
      ts.isFunctionTypeNode(node) ||
      ts.isGetAccessorDeclaration(node)) &&
    node.type !== undefined
  );
}

function isLiteralTypeNode(node: ts.TypeNode): node is ts.LiteralTypeNode {
  return ts.isLiteralTypeNode(node);
}

/** `string` / `number` / `boolean` for a literal type, or undefined. */
function widenedLiteral(node: ts.TypeNode): string | undefined {
  if (!isLiteralTypeNode(node)) return undefined;
  const lit = node.literal;
  if (ts.isStringLiteral(lit) || ts.isNoSubstitutionTemplateLiteral(lit))
    return 'string';
  if (ts.isNumericLiteral(lit)) return 'number';
  if (ts.isPrefixUnaryExpression(lit) && ts.isNumericLiteral(lit.operand))
    return 'number';
  if (
    lit.kind === ts.SyntaxKind.TrueKeyword ||
    lit.kind === ts.SyntaxKind.FalseKeyword
  )
    return 'boolean';
  return undefined;
}

function isNullish(node: ts.TypeNode): boolean {
  return (
    node.kind === ts.SyntaxKind.UndefinedKeyword ||
    (isLiteralTypeNode(node) && node.literal.kind === ts.SyntaxKind.NullKeyword)
  );
}

/** Removes a modifier together with the whitespace after it. */
function modifierRemoval(
  sf: ts.SourceFile,
  modifier: ts.Node,
): { start: number; end: number } {
  let end = modifier.end;
  const text = sf.text;
  while (end < text.length && /[ \t]/.test(text[end] ?? '')) end += 1;
  return { start: modifier.getStart(sf), end };
}

function overloadKey(node: ts.Node): string | undefined {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodSignature(node) ||
    ts.isMethodDeclaration(node)
  ) {
    const name = nameText(node.name);
    if (!name) return undefined;
    const isStatic =
      ts.canHaveModifiers(node) &&
      (ts.getModifiers(node) ?? []).some(
        (m) => m.kind === ts.SyntaxKind.StaticKeyword,
      );
    return `${isStatic ? 'static ' : ''}${name}`;
  }
  return undefined;
}

/** Siblings of `node` that are overloads of the same name, including itself. */
function overloadGroup(node: ts.Node): ts.Node[] {
  const key = overloadKey(node);
  if (!key) return [];
  const parent = node.parent;
  let siblings: readonly ts.Node[] = [];
  if (ts.isSourceFile(parent) || ts.isModuleBlock(parent)) {
    siblings = parent.statements;
  } else if (
    ts.isInterfaceDeclaration(parent) ||
    ts.isClassDeclaration(parent) ||
    ts.isTypeLiteralNode(parent)
  ) {
    siblings = parent.members;
  }
  return siblings.filter((s) => overloadKey(s) === key);
}

function isPrivateMember(node: ts.Node): boolean {
  if (!ts.isClassElement(node)) return false;
  if (node.name && ts.isPrivateIdentifier(node.name)) return true;
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some(
      (m) => m.kind === ts.SyntaxKind.PrivateKeyword,
    )
  );
}

/**
 * The raw mutants inside one exported declaration. Each is independent: one
 * text replacement applied on its own to the original file.
 */
export function mutationsIn(root: ts.Node, sf: ts.SourceFile): RawMutant[] {
  const out: RawMutant[] = [];
  const add = (
    node: ts.Node,
    operator: MutationOperator,
    start: number,
    end: number,
    replacement: string,
  ): void => {
    out.push({ node, operator, start, end, replacement });
  };

  const visit = (node: ts.Node): void => {
    // A private member is emitted without a type and cannot be reached by a
    // consumer, so every edit to it is an equivalent mutant.
    if (isPrivateMember(node)) return;

    // return type -> unknown
    if (hasReturnType(node)) {
      const type = node.type;
      if (!KEYWORD_TYPES_NOT_WORTH_WIDENING.has(type.kind)) {
        add(node, 'return-unknown', type.getStart(sf), type.end, 'unknown');
      }
    }

    // readonly modifier / readonly T[]
    if (ts.canHaveModifiers(node)) {
      for (const m of ts.getModifiers(node) ?? []) {
        if (m.kind === ts.SyntaxKind.ReadonlyKeyword) {
          const { start, end } = modifierRemoval(sf, m);
          add(node, 'drop-readonly', start, end, '');
        }
      }
    }
    if (
      ts.isTypeOperatorNode(node) &&
      node.operator === ts.SyntaxKind.ReadonlyKeyword
    ) {
      add(node, 'drop-readonly', node.getStart(sf), node.type.getStart(sf), '');
    }

    // optional <-> required
    if (
      ts.isPropertySignature(node) ||
      ts.isPropertyDeclaration(node) ||
      ts.isMethodSignature(node)
    ) {
      if (node.questionToken) {
        add(
          node,
          'optional-to-required',
          node.questionToken.getStart(sf),
          node.questionToken.end,
          '',
        );
      } else if (!ts.isMethodSignature(node)) {
        add(node, 'required-to-optional', node.name.end, node.name.end, '?');
      }
    }
    // A parameter list must stay well-formed: no required parameter after an
    // optional one, so each direction only applies where that holds.
    if (ts.isParameter(node) && !node.dotDotDotToken) {
      const isThis = ts.isIdentifier(node.name) && node.name.text === 'this';
      const params = (node.parent as ts.SignatureDeclaration).parameters;
      const index = params.indexOf(node);
      if (node.questionToken) {
        const allEarlierRequired = params
          .slice(0, index)
          .every((p) => p.questionToken === undefined && !p.initializer);
        if (allEarlierRequired) {
          add(
            node,
            'optional-to-required',
            node.questionToken.getStart(sf),
            node.questionToken.end,
            '',
          );
        }
      } else if (!isThis && !node.initializer) {
        const allLaterOptional = params
          .slice(index + 1)
          .every(
            (p) =>
              p.questionToken !== undefined || p.dotDotDotToken !== undefined,
          );
        if (allLaterOptional) {
          add(node, 'required-to-optional', node.name.end, node.name.end, '?');
        }
      }
    }

    // unions: drop a member, widen an all-literal union
    if (ts.isUnionTypeNode(node)) {
      const members = node.types;
      const picks = new Set<number>([0, members.length - 1]);
      members.forEach((m, i) => {
        if (isNullish(m)) picks.add(i);
      });
      for (const i of [...picks].sort((a, b) => a - b)) {
        const rest = members.filter((_, j) => j !== i);
        add(
          node,
          'union-drop-member',
          node.getStart(sf),
          node.end,
          rest.map((m) => m.getText(sf)).join(' | '),
        );
      }
      const widened = members.map(widenedLiteral);
      const first = widened[0];
      if (first && widened.every((w) => w === first)) {
        add(node, 'widen-literal', node.getStart(sf), node.end, first);
      }
    }
    if (ts.isLiteralTypeNode(node)) {
      const widened = widenedLiteral(node);
      const parent = node.parent;
      // Inside a union, widening any one literal of a kind gives the same
      // type, so only the first literal of each kind is mutated; a union of
      // nothing but that kind was already widened as a whole above.
      const isRepeatInUnion =
        ts.isUnionTypeNode(parent) &&
        (parent.types.every((t) => widenedLiteral(t) === widened) ||
          parent.types.find((t) => widenedLiteral(t) === widened) !== node);
      if (widened && !isRepeatInUnion) {
        add(node, 'widen-literal', node.getStart(sf), node.end, widened);
      }
    }

    // overloads: remove one signature of a group
    const group = overloadGroup(node);
    if (group.length >= 2) {
      add(node, 'remove-overload', node.getFullStart(), node.end, '');
    }

    // generic constraint -> unknown. A mapped type's `[K in keyof T]` is an
    // iteration source, not a constraint; replacing it never compiles.
    if (
      ts.isTypeParameterDeclaration(node) &&
      node.constraint &&
      !ts.isMappedTypeNode(node.parent)
    ) {
      if (!KEYWORD_TYPES_NOT_WORTH_WIDENING.has(node.constraint.kind)) {
        add(
          node,
          'constraint-unknown',
          node.constraint.getStart(sf),
          node.constraint.end,
          'unknown',
        );
      }
    }

    ts.forEachChild(node, visit);
  };
  visit(root);
  return out;
}

function lineSpan(
  text: string,
  start: number,
  end: number,
): { from: number; to: number } {
  const from = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  let to = text.indexOf('\n', end);
  if (to === -1) to = text.length;
  return { from, to };
}

const SNIPPET_LIMIT = 240;

function clip(s: string): string {
  const oneLine = s.replace(/\s+/g, ' ').trim();
  return oneLine.length > SNIPPET_LIMIT
    ? `${oneLine.slice(0, SNIPPET_LIMIT - 3)}...`
    : oneLine;
}

/** `before`/`after` snippets: the lines the mutation touches, whitespace collapsed. */
export function describeEdit(
  text: string,
  start: number,
  end: number,
  replacement: string,
): { before: string; after: string } {
  // A removal that begins at a node's full start would otherwise pull in the
  // previous line; anchor the snippet at the first non-trivia character.
  let anchor = start;
  while (anchor < end && /\s/.test(text[anchor] ?? '')) anchor += 1;
  const { from, to } = lineSpan(text, anchor, end);
  const before = text.slice(from, to);
  const after =
    text.slice(from, Math.max(from, start)) + replacement + text.slice(end, to);
  return { before: clip(before), after: clip(after) };
}

/** Applies one mutant to the original text of its file. */
export function applyMutant(
  text: string,
  mutant: Pick<Mutant, 'start' | 'end' | 'replacement'>,
): string {
  return (
    text.slice(0, mutant.start) + mutant.replacement + text.slice(mutant.end)
  );
}

/**
 * Every mutant reachable from the package's entry points. Each distinct edit
 * appears once, carrying every entry point that reaches it.
 */
export function generateMutants(
  program: ts.Program,
  entryPoints: EntryPoint[],
  packageRoot: string,
  declarationDir: string,
): Mutant[] {
  const reached = collectPublicDeclarations(
    program,
    entryPoints,
    declarationDir,
  );
  const byEdit = new Map<string, Mutant>();
  const idCounts = new Map<string, number>();

  // Deterministic order: file, then position.
  const decls = [...reached.entries()].sort(([a], [b]) => {
    const fa = a.getSourceFile().fileName;
    const fb = b.getSourceFile().fileName;
    return fa === fb ? a.pos - b.pos : fa < fb ? -1 : 1;
  });

  for (const [decl, entries] of decls) {
    const sf = decl.getSourceFile();
    const file = toPosix(path.relative(packageRoot, path.resolve(sf.fileName)));
    // A variable statement's `declare const` modifiers sit on the statement.
    const root =
      ts.isVariableDeclaration(decl) &&
      ts.isVariableDeclarationList(decl.parent) &&
      ts.isVariableStatement(decl.parent.parent)
        ? decl.parent.parent
        : decl;
    for (const raw of mutationsIn(root, sf)) {
      const editKey = `${file}:${raw.start}:${raw.end}:${raw.operator}:${raw.replacement}`;
      const existing = byEdit.get(editKey);
      if (existing) {
        for (const e of entries) {
          if (!existing.entryPoints.includes(e)) existing.entryPoints.push(e);
        }
        continue;
      }
      const { before, after } = describeEdit(
        sf.text,
        raw.start,
        raw.end,
        raw.replacement,
      );
      const symbol = symbolPathOf(raw.node) || '(anonymous)';
      const baseId = `${file}#${symbol}#${raw.operator}#${after}`;
      const n = (idCounts.get(baseId) ?? 0) + 1;
      idCounts.set(baseId, n);
      byEdit.set(editKey, {
        id: n === 1 ? baseId : `${baseId}#${n}`,
        file,
        line: sf.getLineAndCharacterOfPosition(raw.start).line + 1,
        symbol,
        operator: raw.operator,
        start: raw.start,
        end: raw.end,
        replacement: raw.replacement,
        before,
        after,
        entryPoints: [...entries],
      });
    }
  }

  const order = new Map(entryPoints.map((e, i) => [e.name, i]));
  const mutants = [...byEdit.values()];
  for (const m of mutants) {
    m.entryPoints.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  }
  return mutants;
}

// ---------------------------------------------------------------------------
// Sampling
// ---------------------------------------------------------------------------

/** FNV-1a, 32-bit. Enough to rank mutants reproducibly; not for security. */
export function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * At most `max` mutants, shared fairly between entry points.
 *
 * Each mutant is ranked by a seeded hash of its id, and entry points take
 * turns picking their lowest-ranked unpicked mutant. Ranking by hash rather
 * than shuffling keeps the sample stable: a new export adds at most one
 * mutant to the selection instead of reshuffling it, so a ratchet measured
 * on yesterday's sample still means something today.
 */
export function sampleMutants(
  mutants: Mutant[],
  entryPoints: string[],
  max: number,
  seed: number,
): Mutant[] {
  const rank = new Map(mutants.map((m) => [m, hash32(`${seed}:${m.id}`)]));
  const byRank = (a: Mutant, b: Mutant): number =>
    (rank.get(a) ?? 0) - (rank.get(b) ?? 0) || (a.id < b.id ? -1 : 1);
  const queues = entryPoints.map((e) =>
    mutants.filter((m) => m.entryPoints.includes(e)).sort(byRank),
  );
  const picked = new Set<Mutant>();
  const cursors = queues.map(() => 0);
  let progressed = true;
  while (picked.size < max && progressed) {
    progressed = false;
    for (let q = 0; q < queues.length && picked.size < max; q += 1) {
      const queue = queues[q] ?? [];
      let c = cursors[q] ?? 0;
      while (c < queue.length && picked.has(queue[c] as Mutant)) c += 1;
      if (c < queue.length) {
        picked.add(queue[c] as Mutant);
        c += 1;
        progressed = true;
      }
      cursors[q] = c;
    }
  }
  return [...picked].sort(byRank);
}

// ---------------------------------------------------------------------------
// Classification and scoring
// ---------------------------------------------------------------------------

export interface TsdDiagnostic {
  fileName: string;
  message: string;
  line?: number;
  column?: number;
}

/**
 * Killed when a type test fails; Invalid when the mutated declarations no
 * longer compile on their own (like Stryker's CompileError, excluded from the
 * score); Survived when tsd passes.
 */
export function classify(
  diagnostics: TsdDiagnostic[],
  isDeclarationFile: (fileName: string) => boolean,
): MutantStatus {
  if (diagnostics.some((d) => isDeclarationFile(d.fileName))) return 'Invalid';
  return diagnostics.length > 0 ? 'Killed' : 'Survived';
}

export interface MutantResult extends Mutant {
  status: MutantStatus;
  /** The first diagnostic, for a killed or invalid mutant. */
  reason?: string;
}

export interface EntryPointScore {
  entryPoint: string;
  killed: number;
  survived: number;
  invalid: number;
  /** killed / (killed + survived) as a percentage, floored to one decimal. */
  score: number;
}

export function scoreByEntryPoint(
  results: MutantResult[],
  entryPoints: string[],
): EntryPointScore[] {
  return entryPoints.map((entryPoint) => {
    const mine = results.filter((r) => r.entryPoints.includes(entryPoint));
    const killed = mine.filter((r) => r.status === 'Killed').length;
    const survived = mine.filter((r) => r.status === 'Survived').length;
    const invalid = mine.filter((r) => r.status === 'Invalid').length;
    const valid = killed + survived;
    return {
      entryPoint,
      killed,
      survived,
      invalid,
      score: valid === 0 ? 0 : Math.floor((killed / valid) * 1000) / 10,
    };
  });
}

// ---------------------------------------------------------------------------
// Ratchet
// ---------------------------------------------------------------------------

/** Minimum score per entry point, e.g. `{ ".": 41.2 }`. */
export type Thresholds = Record<string, number>;

export interface RatchetInput {
  scores: EntryPointScore[];
  thresholds: Thresholds;
  /**
   * The thresholds file on the base ref. `null` when the ref resolved but the
   * file did not exist there (the file is being introduced); `undefined` when
   * no base ref resolved at all, which fails closed.
   */
  baseline: Thresholds | null | undefined;
  baseRef: string | null;
}

export interface RatchetResult {
  failures: string[];
  /** Thresholds raised to today's scores; never lowered, never dropped. */
  raised: Thresholds;
}

export function applyRatchet({
  scores,
  thresholds,
  baseline,
  baseRef,
}: RatchetInput): RatchetResult {
  const failures: string[] = [];
  const raised: Thresholds = { ...thresholds };
  const scored = new Map(scores.map((s) => [s.entryPoint, s]));

  if (baseline === undefined) {
    failures.push(
      'No base ref resolved (set TYPE_MUTATION_BASE_REF or fetch origin/master), so the thresholds cannot be shown not to have been lowered.',
    );
  } else if (baseline !== null) {
    for (const [entry, floor] of Object.entries(baseline)) {
      const now = thresholds[entry];
      if (now === undefined) {
        failures.push(
          `${entry}: its ratchet (${floor}%) on ${baseRef} was removed; thresholds may only rise.`,
        );
      } else if (now < floor) {
        failures.push(
          `${entry}: ratchet lowered from ${floor}% on ${baseRef} to ${now}%; thresholds may only rise.`,
        );
      }
    }
  }

  for (const [entry, floor] of Object.entries(thresholds)) {
    const score = scored.get(entry);
    if (!score || score.killed + score.survived === 0) {
      failures.push(
        `${entry}: has a ratchet but no valid mutants were scored; is it still an exports entry?`,
      );
      continue;
    }
    if (score.score < floor) {
      failures.push(
        `${entry}: type mutation score ${score.score}% is below its ratchet of ${floor}%`,
      );
    }
  }
  for (const s of scores) {
    if (s.killed + s.survived === 0) continue;
    raised[s.entryPoint] = Math.max(thresholds[s.entryPoint] ?? 0, s.score);
  }
  return { failures, raised };
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export function renderScoreTable(
  scores: EntryPointScore[],
  thresholds: Thresholds,
): string {
  const rows = scores.map((s) => {
    const floor = thresholds[s.entryPoint];
    return `| \`${s.entryPoint}\` | ${s.score}% | ${s.killed}/${s.killed + s.survived} | ${s.invalid} | ${floor === undefined ? 'none' : `${floor}%`} |`;
  });
  return [
    '| Entry point | Type mutation score | Killed / valid | Invalid | Ratchet |',
    '| :-- | --: | --: | --: | --: |',
    ...rows,
  ].join('\n');
}

function cell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/`/g, "'");
}

export function renderSurvivors(results: MutantResult[]): string {
  const survivors = results
    .filter((r) => r.status === 'Survived')
    .sort((a, b) =>
      a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1,
    );
  if (survivors.length === 0) return 'No surviving mutants.';
  return [
    '| File | Symbol | Operator | Before | After |',
    '| :-- | :-- | :-- | :-- | :-- |',
    ...survivors.map(
      (r) =>
        `| \`${r.file}:${r.line}\` | \`${cell(r.symbol)}\` | ${r.operator} | \`${cell(r.before)}\` | \`${cell(r.after)}\` |`,
    ),
  ].join('\n');
}
