/**
 * Scope tree emitter (Phase 2 PR 10): arranges the generated operations by
 * path prefix, so a caller writes `tree.character(id).wallet.journal.get()`
 * instead of `getCharactersCharacterIdWalletJournal(transport, { ... })`.
 *
 * The rules, applied to each path in turn:
 *
 * - A literal segment becomes a property, camelCased (`paragon-hub` is
 *   `paragonHub`, `agents_research` is `agentsResearch`).
 * - A literal followed by path parameters becomes a call taking them, in the
 *   order the path names them (`killmails/{id}/{hash}` is `killmail(id, hash)`).
 *   The node stays a namespace too when shorter paths end there, so
 *   `mail.get()` and `mail(mailId).get()` sit side by side.
 * - At the root the call is singular (`characters/{id}` is `character(id)`),
 *   so `character(id)` and the `characters` namespace (`characters.affiliation`)
 *   stay apart, and `/corporation/{id}` merges into `corporation(id)`.
 * - The operation itself is a method named for its HTTP verb. It takes the
 *   request body first, then any query parameters; a page-paginated
 *   operation returns the same `AsyncIterable` the generated function does.
 *
 * `PublicScopeTree` is the same tree with only the operations that need no
 * SSO scope: the type a client without a token hands out.
 */
import type { GeneratedOperation } from './spec-generate-core';

export class ScopeTreeError extends Error {
  override readonly name = 'ScopeTreeError';
}

type Verb = 'get' | 'post' | 'put' | 'delete';
type PathParam = GeneratedOperation['pathParams'][number];

interface Node {
  readonly children: Map<string, Node>;
  readonly leaves: Map<Verb, GeneratedOperation>;
  call?: { readonly params: readonly PathParam[]; readonly node: Node };
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
/** Own properties of a function that a callable node cannot also carry. */
const FUNCTION_OWN = new Set([
  'name',
  'length',
  'prototype',
  'caller',
  'arguments',
  'apply',
  'call',
  'bind',
  'toString',
]);
/** Names the emitted leaves use for their own arguments. */
const RESERVED_ARGS = new Set(['transport', 'params', 'body']);

const node = (): Node => ({ children: new Map(), leaves: new Map() });

/** `freelance-jobs` becomes `freelanceJobs`; `agents_research`, `agentsResearch`. */
export function camelCase(segment: string): string {
  const [first = '', ...rest] = segment.split(/[-_]/);
  return (
    first.charAt(0).toLowerCase() +
    first.slice(1) +
    rest.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  );
}

/** `characters` becomes `character`; `categories`, `category`; `route` stays. */
export function singular(name: string): string {
  if (name.endsWith('ies')) return `${name.slice(0, -3)}y`;
  if (name.endsWith('s')) return name.slice(0, -1);
  return name;
}

function insert(root: Node, op: GeneratedOperation): void {
  const segments = op.path.split('/').filter((s) => s !== '');
  const params = [...op.pathParams];
  let at = root;
  for (let i = 0; i < segments.length;) {
    const literal = segments[i]!;
    if (literal.startsWith('{')) {
      throw new ScopeTreeError(
        `${op.operationId}: ${op.path} has a parameter with no segment before it`,
      );
    }
    i += 1;
    const taken: PathParam[] = [];
    while (i < segments.length && segments[i]!.startsWith('{')) {
      const param = params.shift();
      if (!param || `{${param.name}}` !== segments[i]) {
        throw new ScopeTreeError(
          `${op.operationId}: ${segments[i]} does not match its declared path parameters`,
        );
      }
      taken.push(param);
      i += 1;
    }
    let key = camelCase(literal);
    if (at === root && taken.length > 0) key = singular(key);
    if (!IDENTIFIER.test(key)) {
      throw new ScopeTreeError(
        `${op.operationId}: segment "${literal}" is not a valid property name`,
      );
    }
    const child = at.children.get(key) ?? node();
    at.children.set(key, child);
    if (taken.length === 0) {
      at = child;
      continue;
    }
    child.call ??= { params: taken, node: node() };
    const names = (list: readonly PathParam[]): string =>
      list.map((p) => p.name).join(', ');
    if (names(child.call.params) !== names(taken)) {
      throw new ScopeTreeError(
        `${op.operationId}: ${key}(${names(taken)}) clashes with ${key}(${names(child.call.params)})`,
      );
    }
    at = child.call.node;
  }
  const verb = op.method.toLowerCase() as Verb;
  if (at.leaves.has(verb)) {
    throw new ScopeTreeError(
      `${op.operationId} and ${at.leaves.get(verb)!.operationId} land on the same ${verb}()`,
    );
  }
  at.leaves.set(verb, op);
}

function validate(at: Node, where: string): void {
  for (const [key, child] of at.children) {
    if (at.leaves.has(key as Verb)) {
      throw new ScopeTreeError(
        `${where}${key} is both an operation and a segment`,
      );
    }
    const callable =
      child.call !== undefined &&
      (child.children.size > 0 || child.leaves.size > 0);
    if (callable) {
      for (const own of [...child.children.keys(), ...child.leaves.keys()]) {
        if (FUNCTION_OWN.has(own)) {
          throw new ScopeTreeError(
            `${where}${key}.${own} would shadow a property every function has`,
          );
        }
      }
    }
    validate(child, `${where}${key}.`);
    if (child.call) validate(child.call.node, `${where}${key}(…).`);
  }
}

/** The tree, built and checked, for the generator and its tests. */
export function buildScopeTree(
  operations: readonly GeneratedOperation[],
): Node {
  const root = node();
  for (const op of operations) insert(root, op);
  validate(root, '');
  return root;
}

interface Bound {
  readonly name: string;
  readonly arg: string;
}

function argsFor(
  params: readonly PathParam[],
  bound: readonly Bound[],
): Bound[] {
  return params.map((p) => {
    const arg = camelCase(p.name);
    if (
      !IDENTIFIER.test(arg) ||
      RESERVED_ARGS.has(arg) ||
      bound.some((b) => b.arg === arg)
    ) {
      throw new ScopeTreeError(
        `path parameter ${p.name} cannot be an argument named ${arg}`,
      );
    }
    return { name: p.name, arg };
  });
}

const quoteKey = (key: string): string =>
  IDENTIFIER.test(key) ? key : JSON.stringify(key);

/** The leaf's parameter list: the body first, then what the path left over. */
function leafSignature(op: GeneratedOperation): string {
  const parts: string[] = [];
  if (op.body) {
    const optional = op.body.optional && op.query !== 'required';
    parts.push(
      optional
        ? `body?: ${op.body.type}`
        : `body: ${op.body.type}${op.body.optional ? ' | undefined' : ''}`,
    );
  }
  if (op.query !== 'none' && op.paramsType) {
    const rest =
      op.pathParams.length > 0
        ? `Omit<${op.paramsType}, ${op.pathParams.map((p) => JSON.stringify(p.name)).join(' | ')}>`
        : op.paramsType;
    parts.push(`params${op.query === 'required' ? '' : '?'}: ${rest}`);
  }
  return parts.join(', ');
}

function leafDoc(op: GeneratedOperation): string {
  const needs = op.scopes.length
    ? `Requires ${op.scopes.map((s) => `\`${s}\``).join(', ')}.`
    : 'Public.';
  const lines = [
    op.summary ?? op.operationId,
    '',
    `\`${op.method} ${op.path}\`. ${needs} See \`${op.functionName}\`.`,
    ...(op.deprecated
      ? ['@deprecated ESI marks this operation deprecated.']
      : []),
  ].flatMap((l) => l.replace(/\*\//g, '*\\/').trim().split(/\r?\n/));
  return `/**\n${lines.map((l) => ` * ${l}`.trimEnd()).join('\n')}\n */\n`;
}

const sortedEntries = <K extends string, V>(map: Map<K, V>): [K, V][] =>
  [...map.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

/** The type of a node, or undefined when `keep` leaves nothing in it. */
function typeOf(
  at: Node,
  keep: (op: GeneratedOperation) => boolean,
  bound: readonly Bound[],
): string | undefined {
  const members: string[] = [];
  if (at.call) {
    const args = argsFor(at.call.params, bound);
    const inner = typeOf(at.call.node, keep, [...bound, ...args]);
    if (inner) {
      const list = args
        .map((a, i) => `${a.arg}: ${at.call!.params[i]!.type}`)
        .join(', ');
      members.push(`(${list}): ${inner};`);
    }
  }
  for (const [verb, op] of sortedEntries(at.leaves)) {
    if (!keep(op)) continue;
    members.push(
      `${leafDoc(op)}${verb}(${leafSignature(op)}): ReturnType<typeof ${op.functionName}>;`,
    );
  }
  for (const [key, child] of sortedEntries(at.children)) {
    const inner = typeOf(child, keep, bound);
    if (inner) members.push(`readonly ${key}: ${inner};`);
  }
  return members.length > 0 ? `{\n${members.join('\n')}\n}` : undefined;
}

function leafValue(op: GeneratedOperation, bound: readonly Bound[]): string {
  const args = ['transport'];
  if (op.paramsType) {
    const fields = op.pathParams.map((p) => {
      const b = bound.find((x) => x.name === p.name);
      if (!b) {
        throw new ScopeTreeError(`${op.operationId}: ${p.name} is not bound`);
      }
      return `${quoteKey(p.name)}: ${b.arg}`;
    });
    if (op.query !== 'none') fields.unshift('...params');
    args.push(
      op.query !== 'none' && fields.length === 1
        ? 'params'
        : `{ ${fields.join(', ')} }`,
    );
  }
  if (op.body) args.push('body');
  return `(${leafSignature(op)}) => ${op.functionName}(${args.join(', ')})`;
}

/** The object literal (or callable) that implements a node. */
function valueOf(at: Node, bound: readonly Bound[]): string {
  const members: string[] = [];
  for (const [verb, op] of sortedEntries(at.leaves)) {
    members.push(`${verb}: ${leafValue(op, bound)},`);
  }
  for (const [key, child] of sortedEntries(at.children)) {
    members.push(`${key}: ${valueOf(child, bound)},`);
  }
  const props = `{\n${members.join('\n')}\n}`;
  if (!at.call) return props;
  const args = argsFor(at.call.params, bound);
  const list = args
    .map((a, i) => `${a.arg}: ${at.call!.params[i]!.type}`)
    .join(', ');
  const fn = `(${list}) => (${valueOf(at.call.node, [...bound, ...args])})`;
  return members.length > 0 ? `Object.assign(${fn}, ${props})` : fn;
}

/** The scope tree section of the generated module. */
export function scopeTreeSource(
  operations: readonly GeneratedOperation[],
): string {
  const root = buildScopeTree(operations);
  const all = typeOf(root, () => true, []) ?? '{}';
  const pub = typeOf(root, (op) => op.scopes.length === 0, []) ?? '{}';
  return (
    `/**\n * Every operation, arranged by path prefix: \`character(id).wallet.get()\`.\n` +
    ` * Built by scripts/spec-scope-tree.ts; see its header for the naming rules.\n */\n` +
    `export interface ScopeTree ${all}\n\n` +
    `/** The operations that need no SSO scope, arranged as in \`ScopeTree\`. */\n` +
    `export interface PublicScopeTree ${pub}\n\n` +
    `/** The scope tree over one transport. */\n` +
    `export function createScopeTree(transport: OperationTransport): ScopeTree {\n` +
    `  return ${valueOf(root, [])};\n}\n`
  );
}
