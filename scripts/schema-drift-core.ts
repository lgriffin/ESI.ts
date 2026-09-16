/**
 * Schema drift comparison: hand-written Zod response schemas against the ESI
 * OpenAPI spec.
 *
 * Pure functions with no I/O, so the unit suite can import them. The CLI in
 * `generate-schema-drift-report.ts` fetches the spec, loads the endpoint
 * definitions and reads the baseline.
 */

// ---------------------------------------------------------------------------
// OpenAPI types (mirrored from generate-esi-types.ts)
// ---------------------------------------------------------------------------

export interface OpenApiSchema {
  type?: string | string[];
  format?: string;
  properties?: Record<string, OpenApiSchema>;
  additionalProperties?: boolean | OpenApiSchema;
  items?: OpenApiSchema;
  required?: string[];
  enum?: (string | number | boolean | null)[];
  $ref?: string;
  allOf?: OpenApiSchema[];
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
}

export interface OpenApiOperation {
  operationId?: string;
  tags?: string[];
  responses?: Record<
    string,
    {
      content?: Record<string, { schema?: OpenApiSchema }>;
    }
  >;
}

export interface OpenApiSpec {
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    schemas?: Record<string, OpenApiSchema>;
  };
}

// ---------------------------------------------------------------------------
// Path matching
// ---------------------------------------------------------------------------

/**
 * The shape ESI routes a path template on.
 *
 * Endpoint definitions write `corporations/{corporationId}/projects/` and the
 * spec writes `/corporations/{corporation_id}/projects`. Both reduce to
 * `/corporations/{}/projects`: exactly one leading slash, no trailing slash,
 * and every parameter replaced by `{}`, so parameters match by position and
 * never by name. Literal segments keep their case.
 */
export function pathShape(template: string): string {
  const trimmed = template.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  return `/${trimmed.replace(/\{[^}]*\}/g, '{}')}`;
}

const HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch']);

interface SpecOperationRef {
  path: string;
  operation: OpenApiOperation;
}

/** Spec operations keyed by `<method> <pathShape>`. */
function indexSpecOperations(
  spec: OpenApiSpec,
): Map<string, SpecOperationRef[]> {
  const index = new Map<string, SpecOperationRef[]>();
  for (const [specPath, operations] of Object.entries(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(operations ?? {})) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue;
      const key = `${method.toLowerCase()} ${pathShape(specPath)}`;
      const list = index.get(key) ?? [];
      list.push({ path: specPath, operation });
      index.set(key, list);
    }
  }
  return index;
}

/** The JSON body of the operation's first 2xx response that has one. */
function successResponseSchema(
  operation: OpenApiOperation,
): OpenApiSchema | undefined {
  const codes = Object.keys(operation.responses ?? {})
    .filter((code) => /^2\d\d$/.test(code))
    .sort();
  for (const code of codes) {
    const schema =
      operation.responses?.[code]?.content?.['application/json']?.schema;
    if (schema) return schema;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// OpenAPI schema introspection
// ---------------------------------------------------------------------------

type Kind =
  'object' | 'record' | 'array' | 'string' | 'number' | 'boolean' | 'unknown';

function resolveSpec(
  spec: OpenApiSpec,
  schema: OpenApiSchema,
  depth = 0,
): OpenApiSchema {
  if (depth > 32) return schema;
  if (schema.$ref) {
    const prefix = '#/components/schemas/';
    const resolved = schema.$ref.startsWith(prefix)
      ? spec.components?.schemas?.[schema.$ref.slice(prefix.length)]
      : undefined;
    if (resolved) return resolveSpec(spec, resolved, depth + 1);
  }
  if (schema.allOf) {
    const merged: OpenApiSchema = {
      type: 'object',
      properties: {},
      required: [],
    };
    for (const sub of schema.allOf) {
      const resolved = resolveSpec(spec, sub, depth + 1);
      Object.assign(merged.properties!, resolved.properties ?? {});
      merged.required!.push(...(resolved.required ?? []));
    }
    return merged;
  }
  return schema;
}

function specKind(schema: OpenApiSchema): Kind {
  if (schema.oneOf || schema.anyOf) return 'unknown';
  const types = (
    Array.isArray(schema.type) ? schema.type : [schema.type]
  ).filter((t): t is string => t !== undefined && t !== 'null');
  if (types.length > 1) return 'unknown';
  const type = types[0];
  if (type === 'integer' || type === 'number') return 'number';
  if (type === 'string' || type === 'boolean' || type === 'array') return type;
  if (type === 'object' || schema.properties) {
    return schema.properties ? 'object' : 'record';
  }
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Zod schema introspection (zod v4 `_zod.def`)
// ---------------------------------------------------------------------------

interface ZodLike {
  _zod: {
    def: {
      type: string;
      innerType?: unknown;
      element?: unknown;
      shape?: Record<string, unknown>;
      options?: readonly unknown[];
      in?: unknown;
      values?: readonly unknown[];
      getter?: () => unknown;
    };
  };
}

function isZodLike(value: unknown): value is ZodLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_zod' in value &&
    typeof (value as ZodLike)._zod?.def?.type === 'string'
  );
}

const PRESENCE_WRAPPERS = new Set(['nullable', 'readonly', 'catch']);
const OPTIONAL_WRAPPERS = new Set(['optional', 'default', 'prefault']);

/**
 * Strip wrappers that do not change a value's shape. `.optional()` (and a
 * default, which lets ESI omit the field) makes the field optional;
 * `.nullable()` does not, because a null field is still present.
 */
function unwrapZod(node: unknown): { node: unknown; optional: boolean } {
  let current = node;
  let optional = false;
  for (let i = 0; i < 32 && isZodLike(current); i++) {
    const def = current._zod.def;
    if (OPTIONAL_WRAPPERS.has(def.type) && def.innerType) {
      optional = true;
      current = def.innerType;
    } else if (def.type === 'nonoptional' && def.innerType) {
      optional = false;
      current = def.innerType;
    } else if (PRESENCE_WRAPPERS.has(def.type) && def.innerType) {
      current = def.innerType;
    } else if (def.type === 'pipe' && def.in) {
      current = def.in;
    } else if (def.type === 'lazy' && def.getter) {
      current = def.getter();
    } else {
      break;
    }
  }
  return { node: current, optional };
}

function zodKind(node: unknown): Kind {
  const { node: inner } = unwrapZod(node);
  if (!isZodLike(inner)) return 'unknown';
  const def = inner._zod.def;
  switch (def.type) {
    case 'object':
      return 'object';
    case 'record':
      return 'record';
    case 'array':
      return 'array';
    case 'string':
    case 'enum':
    case 'template_literal':
      return 'string';
    case 'number':
    case 'int':
    case 'bigint':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'literal': {
      const kinds = new Set((def.values ?? []).map((v) => typeof v));
      if (kinds.size !== 1) return 'unknown';
      const only = [...kinds][0];
      if (only === 'string' || only === 'boolean') return only;
      return only === 'number' || only === 'bigint' ? 'number' : 'unknown';
    }
    case 'union': {
      // Only a union of scalars of one kind (an `esiEnum`, say) has a kind;
      // a union of objects is not compared field by field.
      const kinds = new Set((def.options ?? []).map(zodKind));
      if (kinds.size !== 1) return 'unknown';
      const only = [...kinds][0]!;
      return only === 'object' || only === 'array' ? 'unknown' : only;
    }
    default:
      return 'unknown';
  }
}

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

export type DriftKind =
  /** The spec defines the field; the schema does not declare it. */
  | 'missing_from_schema'
  /** The schema requires a field the spec does not define: real bodies fail validation. */
  | 'required_not_in_spec'
  /** The schema declares an optional field the spec does not define. */
  | 'optional_not_in_spec'
  /** The schema requires a field ESI may omit: bodies without it fail validation. */
  | 'required_but_optional_in_spec'
  /** The schema lets a field the spec always sends be omitted. */
  | 'optional_but_required_in_spec'
  /** Schema and spec disagree on what kind of value this is. */
  | 'type_mismatch';

export interface DriftFinding {
  /** Endpoint map and method, e.g. `contractEndpoints.getPublicContractBids`. */
  endpoint: string;
  schemaName: string;
  /** The spec path the endpoint matched, e.g. `/contracts/public/bids/{contract_id}`. */
  specPath: string;
  /** Where in the body, e.g. `[].bidder_id`; `(response)` for the body itself. */
  field: string;
  kind: DriftKind;
  detail: string;
}

type RawFinding = Pick<DriftFinding, 'field' | 'kind' | 'detail'>;

const ROOT = '(response)';

function joinField(at: string, name: string): string {
  return at === '' ? name : `${at}.${name}`;
}

function compareNode(
  spec: OpenApiSpec,
  zodNode: unknown,
  specNode: OpenApiSchema,
  at: string,
  out: RawFinding[],
): void {
  const resolved = resolveSpec(spec, specNode);
  const zk = zodKind(zodNode);
  const sk = specKind(resolved);
  if (zk === 'unknown' || sk === 'unknown') return;

  const objectLike = (k: Kind) => k === 'object' || k === 'record';
  if (zk === 'record' || sk === 'record') {
    if (objectLike(zk) && objectLike(sk)) return;
  }
  if (zk !== sk) {
    out.push({
      field: at === '' ? ROOT : at,
      kind: 'type_mismatch',
      detail: `schema expects ${zk}, spec defines ${sk}`,
    });
    return;
  }

  const inner = unwrapZod(zodNode).node as ZodLike;
  if (zk === 'array') {
    if (resolved.items) {
      compareNode(spec, inner._zod.def.element, resolved.items, `${at}[]`, out);
    }
    return;
  }
  if (zk !== 'object') return;

  const shape = inner._zod.def.shape ?? {};
  const specProps = resolved.properties ?? {};
  const required = new Set(resolved.required ?? []);

  for (const [name, prop] of Object.entries(specProps)) {
    const field = joinField(at, name);
    if (!(name in shape)) {
      out.push({
        field,
        kind: 'missing_from_schema',
        detail: `spec defines ${required.has(name) ? 'required' : 'optional'} ${specKind(resolveSpec(spec, prop))} field; schema does not declare it`,
      });
      continue;
    }
    const zodOptional = unwrapZod(shape[name]).optional;
    if (!zodOptional && !required.has(name)) {
      out.push({
        field,
        kind: 'required_but_optional_in_spec',
        detail:
          'schema requires the field; spec marks it optional, so a body without it fails validation',
      });
    } else if (zodOptional && required.has(name)) {
      out.push({
        field,
        kind: 'optional_but_required_in_spec',
        detail: 'schema marks the field optional; spec requires it',
      });
    }
    compareNode(spec, shape[name], prop, field, out);
  }

  for (const [name, node] of Object.entries(shape)) {
    if (name in specProps) continue;
    const optional = unwrapZod(node).optional;
    out.push({
      field: joinField(at, name),
      kind: optional ? 'optional_not_in_spec' : 'required_not_in_spec',
      detail: optional
        ? 'schema declares an optional field the spec does not define'
        : 'schema requires a field the spec does not define, so every body fails validation',
    });
  }
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

/** One endpoint definition whose response is validated by a Zod schema. */
export interface EndpointSchemaMapping {
  /** Endpoint map and method, e.g. `contractEndpoints.getPublicContractBids`. */
  endpoint: string;
  /** The definition's path template, e.g. `contracts/public/bids/{contractId}`. */
  path: string;
  /** HTTP method, any case. */
  method: string;
  /** Name of the exported schema, for messages and exceptions. */
  schemaName: string;
  /** The Zod schema itself. */
  schema: unknown;
}

/**
 * Build mappings from loaded `*Endpoints.ts` modules: every exported endpoint
 * map, every definition with a `responseSchema`.
 *
 * Reading the definitions as values pairs each path with its own schema. The
 * previous regex pass paired the n-th `path:` with the n-th `responseSchema:`
 * in a file, which shifts as soon as one definition has no schema.
 *
 * @param modules File basename → the module's exports.
 * @param schemaNames Exported schema object → its export name.
 */
export function mappingsFromEndpointModules(
  modules: Record<string, Record<string, unknown>>,
  schemaNames: Map<unknown, string>,
): EndpointSchemaMapping[] {
  const mappings: EndpointSchemaMapping[] = [];
  for (const file of Object.keys(modules).sort()) {
    for (const [mapName, exported] of Object.entries(modules[file]!)) {
      if (typeof exported !== 'object' || exported === null) continue;
      for (const [name, def] of Object.entries(exported)) {
        const d = def as Partial<{
          path: unknown;
          method: unknown;
          responseSchema: unknown;
        }>;
        if (
          typeof d !== 'object' ||
          d === null ||
          typeof d.path !== 'string' ||
          typeof d.method !== 'string' ||
          !isZodLike(d.responseSchema)
        ) {
          continue;
        }
        mappings.push({
          endpoint: `${mapName}.${name}`,
          path: d.path,
          method: d.method.toLowerCase(),
          schemaName: schemaNameOf(d.responseSchema, schemaNames),
          schema: d.responseSchema,
        });
      }
    }
  }
  return mappings;
}

/** `ContractBidSchema`, `ContractBidSchema[]` for an array of it, or `(inline)`. */
function schemaNameOf(schema: unknown, names: Map<unknown, string>): string {
  const direct = names.get(schema);
  if (direct) return direct;
  const { node } = unwrapZod(schema);
  if (names.has(node)) return names.get(node)!;
  if (isZodLike(node) && node._zod.def.type === 'array') {
    const element = unwrapZod(node._zod.def.element).node;
    const name = names.get(node._zod.def.element) ?? names.get(element);
    if (name) return `${name}[]`;
  }
  return '(inline)';
}

export type UnmatchedReason =
  'path_not_in_spec' | 'method_not_in_spec' | 'ambiguous_in_spec';

export interface UnmatchedMapping {
  endpoint: string;
  path: string;
  method: string;
  reason: UnmatchedReason;
}

export interface UncomparedMapping {
  endpoint: string;
  specPath: string;
  reason: string;
}

export interface SchemaDriftReport {
  /** Endpoint definitions with a response schema. */
  mappings: number;
  /** Mappings that resolved to exactly one spec operation. */
  matched: number;
  /** Mappings whose schema was actually compared with a spec response body. */
  compared: number;
  /** Mappings that resolved to no spec operation, listed rather than skipped. */
  unmatched: UnmatchedMapping[];
  /** Mappings that matched an operation but could not be compared. */
  uncompared: UncomparedMapping[];
  findings: DriftFinding[];
  /** `schema-drift-exceptions.json` entries that suppressed nothing. */
  unusedExceptions: string[];
}

/** Schema name → field paths (relative to that schema) accepted as deviations. */
export type DriftExceptions = Record<string, string[]>;

function exceptionField(field: string): string {
  return field.replace(/^\[\]\.?/, '');
}

export function buildDriftReport(
  spec: OpenApiSpec,
  mappings: EndpointSchemaMapping[],
  exceptions: DriftExceptions = {},
): SchemaDriftReport {
  const index = indexSpecOperations(spec);
  const report: SchemaDriftReport = {
    mappings: mappings.length,
    matched: 0,
    compared: 0,
    unmatched: [],
    uncompared: [],
    findings: [],
    unusedExceptions: [],
  };
  const usedExceptions = new Set<string>();

  for (const mapping of mappings) {
    const method = mapping.method.toLowerCase();
    const shape = pathShape(mapping.path);
    const candidates = index.get(`${method} ${shape}`) ?? [];

    if (candidates.length !== 1) {
      const pathExists = [...index.keys()].some((key) =>
        key.endsWith(` ${shape}`),
      );
      report.unmatched.push({
        endpoint: mapping.endpoint,
        path: mapping.path,
        method,
        reason:
          candidates.length > 1
            ? 'ambiguous_in_spec'
            : pathExists
              ? 'method_not_in_spec'
              : 'path_not_in_spec',
      });
      continue;
    }

    const { path: specPath, operation } = candidates[0]!;
    report.matched++;

    const body = successResponseSchema(operation);
    if (!body) {
      report.uncompared.push({
        endpoint: mapping.endpoint,
        specPath,
        reason: 'spec defines no JSON success body',
      });
      continue;
    }
    report.compared++;

    const raw: RawFinding[] = [];
    compareNode(spec, mapping.schema, body, '', raw);

    const exceptionKey = mapping.schemaName.replace(/\[\]$/, '');
    const accepted = new Set(exceptions[exceptionKey] ?? []);
    for (const finding of raw) {
      const relative = exceptionField(finding.field);
      if (accepted.has(relative)) {
        usedExceptions.add(`${exceptionKey}.${relative}`);
        continue;
      }
      report.findings.push({
        endpoint: mapping.endpoint,
        schemaName: mapping.schemaName,
        specPath,
        ...finding,
      });
    }
  }

  for (const [schemaName, fields] of Object.entries(exceptions)) {
    if (!Array.isArray(fields)) continue;
    for (const field of fields) {
      const key = `${schemaName}.${field}`;
      if (!usedExceptions.has(key)) report.unusedExceptions.push(key);
    }
  }

  return report;
}

// ---------------------------------------------------------------------------
// Integrity: a check that compares nothing must not pass
// ---------------------------------------------------------------------------

/**
 * The largest share of mappings that may resolve to no spec operation. Above
 * this, path matching is broken rather than a few endpoints being newer than
 * the pinned compatibility date.
 */
export const MAX_UNMATCHED_FRACTION = 0.25;

export function integrityProblems(
  report: SchemaDriftReport,
  maxUnmatchedFraction = MAX_UNMATCHED_FRACTION,
): string[] {
  const problems: string[] = [];
  if (report.mappings === 0) {
    problems.push('No endpoint definition with a responseSchema was found.');
  }
  if (report.compared === 0) {
    problems.push(
      `No schema was compared with the spec (${report.mappings} mappings, ` +
        `${report.matched} matched). The check would pass without checking anything.`,
    );
  }
  if (
    report.mappings > 0 &&
    report.unmatched.length / report.mappings > maxUnmatchedFraction
  ) {
    problems.push(
      `${report.unmatched.length} of ${report.mappings} mappings resolve to no spec ` +
        `operation (more than ${Math.round(maxUnmatchedFraction * 100)}%). ` +
        'Path matching is broken or the spec is not the one the endpoints target.',
    );
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Known-drift baseline (a shrink-only ratchet)
// ---------------------------------------------------------------------------

/** Baseline key → the bead that tracks fixing it. */
export interface DriftBaseline {
  /** `<endpoint> <field> <kind>` → bead id. */
  findings: Record<string, string>;
  /** `<endpoint>` → bead id, for mappings that resolve to no spec operation. */
  unmatched: Record<string, string>;
}

const BEAD_ID = /^esi-[a-z0-9]+(\.[0-9]+)*$/;

export function findingKey(finding: DriftFinding): string {
  return `${finding.endpoint} ${finding.field} ${finding.kind}`;
}

export function emptyBaseline(): DriftBaseline {
  return { findings: {}, unmatched: {} };
}

/** Parse and validate a baseline file. Throws on anything malformed. */
export function parseBaseline(raw: string): DriftBaseline {
  const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;
  const baseline = emptyBaseline();
  for (const section of ['findings', 'unmatched'] as const) {
    const entries = parsed[section] ?? {};
    if (
      typeof entries !== 'object' ||
      entries === null ||
      Array.isArray(entries)
    ) {
      throw new Error(
        `Baseline '${section}' must be an object of key → bead id.`,
      );
    }
    for (const [key, bead] of Object.entries(entries)) {
      if (typeof bead !== 'string' || !BEAD_ID.test(bead)) {
        throw new Error(
          `Baseline ${section} entry '${key}' must name the bead that tracks it (got ${JSON.stringify(bead)}).`,
        );
      }
      baseline[section][key] = bead;
    }
  }
  return baseline;
}

/** Serialise with sorted keys, so regenerating the file gives a stable diff. */
export function serializeBaseline(
  baseline: DriftBaseline,
  comment: string,
): string {
  const sorted = (entries: Record<string, string>) =>
    Object.fromEntries(
      Object.keys(entries)
        .sort()
        .map((key) => [key, entries[key]!]),
    );
  return `${JSON.stringify(
    {
      $comment: comment,
      findings: sorted(baseline.findings),
      unmatched: sorted(baseline.unmatched),
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
  baseline: DriftBaseline | null;
}

export interface RatchetResult {
  /** Drift found now that the baseline does not list. */
  newFindings: DriftFinding[];
  /** Unmatched mappings the baseline does not list. */
  newUnmatched: UnmatchedMapping[];
  /** Baseline entries that no longer occur: the drift was fixed, remove them. */
  stale: string[];
  /** Baseline entries absent from the base ref's baseline: the list grew. */
  added: string[];
  /** Set when no base ref resolved, so additions could not be checked. */
  baseRefMissing: boolean;
}

export function applyBaseline(
  report: SchemaDriftReport,
  baseline: DriftBaseline,
  base: BaseBaseline,
): RatchetResult {
  const foundKeys = new Set(report.findings.map(findingKey));
  const unmatchedKeys = new Set(report.unmatched.map((u) => u.endpoint));

  const newFindings = report.findings.filter(
    (f) => !(findingKey(f) in baseline.findings),
  );
  const newUnmatched = report.unmatched.filter(
    (u) => !(u.endpoint in baseline.unmatched),
  );
  const stale = [
    ...Object.keys(baseline.findings).filter((key) => !foundKeys.has(key)),
    ...Object.keys(baseline.unmatched)
      .filter((key) => !unmatchedKeys.has(key))
      .map((key) => `${key} (unmatched)`),
  ];

  const added: string[] = [];
  if (base.ref === null || base.baseline !== null) {
    const before = base.baseline ?? emptyBaseline();
    for (const key of Object.keys(baseline.findings)) {
      if (!(key in before.findings)) added.push(key);
    }
    for (const key of Object.keys(baseline.unmatched)) {
      if (!(key in before.unmatched)) added.push(`${key} (unmatched)`);
    }
  }

  return {
    newFindings,
    newUnmatched,
    stale,
    added,
    baseRefMissing: base.ref === null,
  };
}

export function ratchetProblems(result: RatchetResult): string[] {
  const problems: string[] = [];
  if (result.newFindings.length > 0) {
    problems.push(
      `${result.newFindings.length} drift finding(s) are not in the baseline: fix the schema.`,
    );
  }
  if (result.newUnmatched.length > 0) {
    problems.push(
      `${result.newUnmatched.length} endpoint(s) resolve to no spec operation and are not in the baseline.`,
    );
  }
  if (result.stale.length > 0) {
    problems.push(
      `${result.stale.length} baseline entr(y/ies) no longer occur: remove them from the baseline.`,
    );
  }
  if (result.added.length > 0) {
    problems.push(
      result.baseRefMissing
        ? `No base ref resolved, so the ${result.added.length} baseline entries cannot be shown not to be new. ` +
            'Fetch master or set SCHEMA_DRIFT_BASE_REF.'
        : `${result.added.length} baseline entr(y/ies) are not on the base branch: the baseline only shrinks.`,
    );
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Exit code
// ---------------------------------------------------------------------------

/** The check itself is broken: it compared nothing, or matched too little. */
export const EXIT_INTEGRITY = 2;
/** `--ci` and the ratchet failed: new drift, stale or added baseline entries. */
export const EXIT_DRIFT = 1;

/**
 * Report mode exits 0 unless the check is broken. `--ci` also fails when the
 * report disagrees with the baseline. Without a ratchet result, `--ci` fails
 * on any finding.
 */
export function exitCodeFor(
  report: SchemaDriftReport,
  options: { ci: boolean; ratchet?: RatchetResult },
): number {
  if (integrityProblems(report).length > 0) return EXIT_INTEGRITY;
  if (!options.ci) return 0;
  if (!options.ratchet) {
    return report.findings.length > 0 || report.unmatched.length > 0
      ? EXIT_DRIFT
      : 0;
  }
  return ratchetProblems(options.ratchet).length > 0 ? EXIT_DRIFT : 0;
}
