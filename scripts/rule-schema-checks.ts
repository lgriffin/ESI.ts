/**
 * Rule ↔ schema consistency checks.
 *
 * A Rule title is a promise about what the client returns. When it names a
 * response field, the promise has to agree with the Zod schema the pipeline
 * validates that response against: if the schema lets ESI omit the field, a
 * Rule that says the client "shall return … home_location" promises more than
 * the library guarantees. Such a Rule must qualify the field ("when present").
 *
 * This module holds everything that does not need a Gherkin AST — mapping a
 * feature file to its endpoint definitions, walking Zod schemas, finding field
 * mentions in a title, and the exception-list ratchet — so Jest can load it.
 * `@cucumber/gherkin` is ESM-only; `rule-schema-check.ts` owns the AST walk
 * and the CLI, exactly as `spec-audit.ts` / `spec-audit-checks.ts` do.
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';
import * as path from 'path';

import { checkExceptionList } from './spec-audit-checks';

export const REPO_ROOT = path.resolve(__dirname, '..');
export const ENDPOINTS_DIR = path.join(REPO_ROOT, 'src', 'core', 'endpoints');
export const RULE_SCHEMA_EXCEPTIONS_PATH = path.resolve(
  __dirname,
  'rule-schema-exceptions.json',
);

// ---------------------------------------------------------------------------
// Zod schema introspection
// ---------------------------------------------------------------------------

/**
 * The slice of Zod v4's internal definition this module reads. Typed
 * structurally so the checks carry no runtime dependency on a Zod version and
 * the unit tests can hand in real schemas without casts.
 */
interface ZodLike {
  _zod: {
    def: {
      type: string;
      innerType?: ZodLike;
      element?: ZodLike;
      shape?: Record<string, ZodLike>;
      options?: readonly ZodLike[];
      valueType?: ZodLike;
      in?: ZodLike;
      out?: ZodLike;
    };
  };
}

/** One object schema: each declared field and whether ESI may omit it. */
export interface SchemaObject {
  /** The endpoint method whose response contains the object, e.g. `getClones`. */
  endpoint: string;
  /** Where the object sits, for messages, e.g. `getClones.home_location`. */
  label: string;
  /** Field name → true when the schema marks the field optional. */
  fields: Map<string, boolean>;
}

function isZodLike(value: unknown): value is ZodLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_zod' in value &&
    typeof (value as ZodLike)._zod?.def?.type === 'string'
  );
}

/** Strip wrappers that do not change which fields an object declares. */
function unwrap(schema: ZodLike): { inner: ZodLike; optional: boolean } {
  let current = schema;
  let optional = false;
  for (;;) {
    const def = current._zod.def;
    if (def.type === 'optional' && def.innerType) {
      optional = true;
      current = def.innerType;
    } else if (
      (def.type === 'nullable' ||
        def.type === 'default' ||
        def.type === 'readonly' ||
        def.type === 'catch') &&
      def.innerType
    ) {
      current = def.innerType;
    } else {
      return { inner: current, optional };
    }
  }
}

/**
 * Collect every object schema reachable from `root`, at any depth — through
 * arrays, unions, records and pipes — with the optionality of each field.
 *
 * Only `.optional()` counts as optional. A `.nullable()` field is always
 * present in the payload, so a Rule naming it promises nothing the schema
 * does not guarantee.
 */
export function collectSchemaObjects(
  root: unknown,
  endpoint: string,
): SchemaObject[] {
  const objects: SchemaObject[] = [];
  const seen = new Set<ZodLike>();

  const visit = (node: unknown, at: string): void => {
    if (!isZodLike(node) || seen.has(node)) return;
    seen.add(node);
    const { inner } = unwrap(node);
    const def = inner._zod.def;

    switch (def.type) {
      case 'object': {
        const fields = new Map<string, boolean>();
        for (const [name, field] of Object.entries(def.shape ?? {})) {
          fields.set(name, unwrap(field).optional);
        }
        objects.push({ endpoint, label: at, fields });
        for (const [name, field] of Object.entries(def.shape ?? {})) {
          visit(field, `${at}.${name}`);
        }
        return;
      }
      case 'array':
        visit(def.element, `${at}[]`);
        return;
      case 'union':
        for (const option of def.options ?? []) visit(option, at);
        return;
      case 'record':
        visit(def.valueType, `${at}{}`);
        return;
      case 'pipe':
        visit(def.in, at);
        visit(def.out, at);
        return;
      default:
        return;
    }
  };

  visit(root, endpoint);
  return objects;
}

// ---------------------------------------------------------------------------
// Feature file → endpoint definitions
// ---------------------------------------------------------------------------

/**
 * Feature files numbered below this are domain clients (one per client); the
 * 005x range is cross-cutting pipeline behaviour with no response schema.
 */
const FIRST_CROSS_CUTTING_NUMBER = 50;

/**
 * The domain a feature file specifies, or null when the file is not a domain
 * client feature (cross-cutting, integration, performance, SDE).
 */
export function domainOfFeature(featurePath: string): string | null {
  const normalised = featurePath.split(path.sep).join('/');
  const match = /(?:^|\/)features\/core\/(\d{4})-([a-z0-9-]+)\.feature$/.exec(
    normalised,
  );
  if (!match) return null;
  if (Number(match[1]) >= FIRST_CROSS_CUTTING_NUMBER) return null;
  return match[2]!;
}

function camelCase(words: string[]): string {
  return words
    .map((w, i) => (i === 0 ? w : w[0]!.toUpperCase() + w.slice(1)))
    .join('');
}

/**
 * Candidate `*Endpoints.ts` basenames for a domain, most specific first.
 *
 * Feature files are named for the client (`0031-skills`), endpoint files
 * mostly for the singular resource (`skillEndpoints`). Trying the name as
 * written and then with its last word singularised covers every domain in the
 * repository without a hand-maintained table; `mapFeatureToEndpoints` fails
 * loudly when neither exists, so a new domain cannot slip past unchecked.
 */
export function endpointFileCandidates(domain: string): string[] {
  const words = domain.split('-');
  const exact = `${camelCase(words)}Endpoints.ts`;
  const last = words[words.length - 1]!;
  if (!last.endsWith('s')) return [exact];
  const singular = `${camelCase([...words.slice(0, -1), last.slice(0, -1)])}Endpoints.ts`;
  return [exact, singular];
}

export interface EndpointSource {
  /** Endpoint file basename, e.g. `cloneEndpoints.ts`. */
  file: string;
  /** Every object schema reachable from any endpoint's `responseSchema`. */
  objects: SchemaObject[];
}

interface EndpointLike {
  path: string;
  method: string;
  responseSchema?: unknown;
}

function isEndpointMap(value: unknown): value is Record<string, EndpointLike> {
  if (typeof value !== 'object' || value === null) return false;
  const entries = Object.values(value);
  return (
    entries.length > 0 &&
    entries.every(
      (e) =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as EndpointLike).path === 'string' &&
        typeof (e as EndpointLike).method === 'string',
    )
  );
}

/**
 * Resolve a feature file to the response schemas of its domain's endpoints.
 *
 * Returns null for files that are not domain features. Throws when a domain
 * feature has no matching endpoint file, because silently skipping it would
 * exempt the whole file from the check.
 */
export function mapFeatureToEndpoints(
  featurePath: string,
  endpointsDir: string = ENDPOINTS_DIR,
): EndpointSource | null {
  const domain = domainOfFeature(featurePath);
  if (domain === null) return null;

  const available = new Set(readdirSync(endpointsDir));
  const file = endpointFileCandidates(domain).find((c) => available.has(c));
  if (!file) {
    throw new Error(
      `No endpoint definitions found for domain '${domain}' ` +
        `(looked for ${endpointFileCandidates(domain).join(', ')} in ` +
        `${path.relative(REPO_ROOT, endpointsDir)}).`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const moduleExports = require(path.join(endpointsDir, file)) as Record<
    string,
    unknown
  >;
  const objects: SchemaObject[] = [];
  for (const exported of Object.values(moduleExports)) {
    if (!isEndpointMap(exported)) continue;
    for (const [method, def] of Object.entries(exported)) {
      if (def.responseSchema) {
        objects.push(...collectSchemaObjects(def.responseSchema, method));
      }
    }
  }
  return { file, objects };
}

// ---------------------------------------------------------------------------
// Field mentions in a Rule title
// ---------------------------------------------------------------------------

export interface FieldMention {
  field: string;
  /** The text in the title that named the field. */
  text: string;
  start: number;
  end: number;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The spellings under which a title can name a field: the identifier itself
 * (`home_location`) and, for multi-word identifiers, the prose form
 * (`home location`), where a trailing `_id` reads `identifier` and the last
 * word may carry or drop a plural "s". Single-word fields are matched only as written.
 */
function fieldPatterns(field: string): RegExp[] {
  const patterns = [new RegExp(`\\b${escapeRegExp(field)}\\b`, 'gi')];
  const words = field.split('_').filter((w) => w.length > 0);
  if (words.length > 1) {
    const last = words[words.length - 1]!;
    const head = words.slice(0, -1).map(escapeRegExp).join('\\s+');
    // "character ID" in a title is almost always the request parameter, so
    // only the spelled-out "identifier" reads as the response field.
    // Prose inflects where identifiers do not: "bonus remap count" names
    // bonus_remaps, so the last word matches with or without a plural "s".
    const stem = last.endsWith('s') ? last.slice(0, -1) : last;
    const tail = last === 'id' ? 'identifiers?' : `${escapeRegExp(stem)}s?`;
    patterns.push(new RegExp(`\\b${head}\\s+${tail}\\b`, 'gi'));
  }
  return patterns;
}

/**
 * Every field from `fieldNames` that `text` names, keeping the longest match
 * where two overlap — "solar system identifier" is `solar_system_id`, not
 * also `system_id`.
 */
export function findFieldMentions(
  text: string,
  fieldNames: Iterable<string>,
): FieldMention[] {
  const raw: FieldMention[] = [];
  for (const field of fieldNames) {
    for (const pattern of fieldPatterns(field)) {
      for (const match of text.matchAll(pattern)) {
        raw.push({
          field,
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
  }

  raw.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: FieldMention[] = [];
  for (const mention of raw) {
    const covered = kept.some(
      (k) =>
        k.start <= mention.start &&
        k.end >= mention.end &&
        !(k.start === mention.start && k.end === mention.end),
    );
    const duplicate = kept.some(
      (k) =>
        k.start === mention.start &&
        k.end === mention.end &&
        k.field === mention.field,
    );
    if (!covered && !duplicate) kept.push(mention);
  }
  return kept;
}

/**
 * Phrases that tell the reader a named field may be absent. They qualify every
 * field mentioned before them, so "carrying A and B when present" covers both.
 */
const PRESENCE_QUALIFIERS: RegExp[] = [
  /\b(?:when|if|where)\s+(?:(?:it|they|that|this|each|one)\s+(?:is|are)\s+)?present\b/i,
  /\b(?:when|if|where)\s+ESI\s+(?:supplies|includes|returns|reports|sets)\s+(?:it|them|one)\b/i,
];

/**
 * "the optional finish_time" qualifies the field that immediately follows, and
 * "either ISK or PLEX" says neither is guaranteed on its own.
 */
const OPTIONAL_PREFIX = /\b(?:optional|either)\s+$|\beither\s+\S+\s+or\s+$/i;

/** "no station identifier" denies presence rather than promising it. */
const NEGATION_PREFIX = /\b(?:no|without|not|never)\s+(?:(?:a|an|the)\s+)?$/i;

export function isQualified(response: string, mention: FieldMention): boolean {
  if (OPTIONAL_PREFIX.test(response.slice(0, mention.start))) return true;
  const after = response.slice(mention.end);
  return PRESENCE_QUALIFIERS.some((q) => q.test(after));
}

function isNegated(response: string, mention: FieldMention): boolean {
  return NEGATION_PREFIX.test(response.slice(0, mention.start));
}

// ---------------------------------------------------------------------------
// The check
// ---------------------------------------------------------------------------

export interface OptionalFieldFinding {
  field: string;
  /** The text in the title that named the field. */
  mention: string;
  /** Labels of the schema objects that make the field optional. */
  schemas: string[];
}

/** Words in an endpoint method name that say nothing about the resource. */
const METHOD_NOISE = new Set([
  'get',
  'post',
  'put',
  'delete',
  'by',
  'id',
  'info',
]);

/** Crude but symmetric singular form, so "facilities" meets "Facility". */
function singular(word: string): string {
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function resourceWords(method: string): string[] {
  return method
    .split(/(?=[A-Z])/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length > 0 && !METHOD_NOISE.has(w))
    .map(singular);
}

/**
 * The endpoints a Rule's trigger names: those whose method-name resource words
 * ("getPlanetById" → planet) all occur in the trigger, keeping only the most
 * specific. "When a planet is requested" selects `getPlanetById` and not
 * `getStructureById`, even though both objects carry `name` and `position`.
 */
export function endpointsNamedBy(trigger: string, methods: string[]): string[] {
  const words = new Set(
    (trigger.toLowerCase().match(/[a-z]+/g) ?? []).map(singular),
  );
  const named = methods
    .map((m) => ({ m, w: resourceWords(m) }))
    .filter(({ w }) => w.length > 0 && w.every((x) => words.has(x)));
  const most = Math.max(0, ...named.map(({ w }) => w.length));
  return [
    ...new Set(named.filter(({ w }) => w.length === most).map(({ m }) => m)),
  ];
}

/**
 * Report each field a Rule title promises without qualification although the
 * schema lets ESI omit it.
 *
 * Only the response — the text after `shall` — is read: a field named in the
 * trigger ("using a planet_id taken from the listing") is a condition, not a
 * promise, and a field preceded by "no" or "without" is a denial.
 *
 * A field name can occur in several objects of one domain with different
 * optionality (`description` is optional on a character profile but required
 * on a medal), so each mention is resolved to the objects the title most
 * plausibly means, narrowing in three steps:
 *
 *   1. objects of the endpoints the trigger names (see `endpointsNamedBy`);
 *   2. among those, the objects declaring the most of the title's fields;
 *   3. among those, the objects declaring this field.
 *
 * Each step that would leave no object declaring the field is skipped — except
 * the first: when the trigger names endpoints and none of them declares the
 * field, the word is prose, not a field, and is ignored. The field is reported
 * only when it is optional in every object that remains, so
 * ambiguity resolves towards silence — the check is meant to be a hard gate,
 * and a gate that cries wolf gets switched off.
 */
export function checkRuleTitle(
  title: string,
  objects: SchemaObject[],
): OptionalFieldFinding[] {
  const shall = /\bshall\b/i.exec(title);
  if (!shall || objects.length === 0) return [];
  // The trigger is the EARS clause before the system name: "When a planet is
  // requested by identifier" in "When …, the Universe client shall …". The
  // system name is excluded because "the Location client" would otherwise name
  // getCharacterLocation for every Rule in the file.
  const trigger = title.slice(
    0,
    Math.max(0, title.lastIndexOf(',', shall.index)),
  );
  const response = title.slice(shall.index + shall[0].length);

  const fieldNames = new Set<string>();
  for (const o of objects) for (const f of o.fields.keys()) fieldNames.add(f);

  const mentions = findFieldMentions(response, fieldNames).filter(
    (m) => !isNegated(response, m),
  );
  if (mentions.length === 0) return [];
  const named = new Set(mentions.map((m) => m.field));

  const methods = [...new Set(objects.map((o) => o.endpoint))];
  const triggerEndpoints = new Set(endpointsNamedBy(trigger, methods));
  const inTrigger = objects.filter((o) => triggerEndpoints.has(o.endpoint));

  const bestCover = (pool: SchemaObject[]): SchemaObject[] => {
    const scores = pool.map(
      (o) => [...named].filter((f) => o.fields.has(f)).length,
    );
    const best = Math.max(0, ...scores);
    return pool.filter((_, i) => scores[i] === best && best > 0);
  };
  const narrowed = bestCover(inTrigger.length > 0 ? inTrigger : objects);

  const findings: OptionalFieldFinding[] = [];
  const reported = new Set<string>();
  for (const mention of mentions) {
    if (reported.has(mention.field)) continue;
    if (isQualified(response, mention)) continue;

    const declares = (o: SchemaObject) => o.fields.has(mention.field);
    // Once the trigger has named its endpoints, a field none of them declare
    // is prose that happens to share a name ("ship volume" on a station), not
    // a promise about some other endpoint's payload.
    const pools =
      inTrigger.length > 0 ? [narrowed, inTrigger] : [narrowed, objects];
    const candidates = pools
      .map((pool) => pool.filter(declares))
      .find((pool) => pool.length > 0);
    if (!candidates) continue;
    if (candidates.every((o) => o.fields.get(mention.field) === true)) {
      reported.add(mention.field);
      findings.push({
        field: mention.field,
        mention: mention.text,
        schemas: [...new Set(candidates.map((o) => o.label))].sort(),
      });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Exception list (warn-only files)
// ---------------------------------------------------------------------------

export interface RuleSchemaExceptions {
  /**
   * Feature files whose findings are reported as warnings rather than errors.
   * Ratcheted: entries may only be removed, and a listed file with no findings
   * fails the run until its entry is removed.
   */
  warnOnly: string[];
}

export function loadRuleSchemaExceptions(
  exceptionsPath: string = RULE_SCHEMA_EXCEPTIONS_PATH,
): RuleSchemaExceptions {
  if (!existsSync(exceptionsPath)) return { warnOnly: [] };
  const parsed = JSON.parse(
    readFileSync(exceptionsPath, 'utf-8'),
  ) as Partial<RuleSchemaExceptions>;
  return { warnOnly: parsed.warnOnly ?? [] };
}

export interface WarnOnlyBaseline {
  /** The ref the baseline was read from. */
  ref: string;
  /** False when the ref predates the exception file: this change introduces it. */
  present: boolean;
  entries: Set<string>;
}

/**
 * The warn-only list as committed on the integration branch, or null when no
 * baseline ref resolves (a shallow CI checkout, a tarball, no git at all).
 */
export function loadBaselineWarnOnly(): WarnOnlyBaseline | null {
  const relPath = path
    .relative(REPO_ROOT, RULE_SCHEMA_EXCEPTIONS_PATH)
    .split(path.sep)
    .join('/');
  const refs = [
    process.env.SPEC_AUDIT_BASE_REF,
    'origin/master',
    'master',
  ].filter((ref): ref is string => Boolean(ref));

  const git = (args: string[]): string =>
    execFileSync('git', args, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

  for (const ref of refs) {
    try {
      git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    } catch {
      continue; // Ref not available in this checkout; try the next one.
    }
    try {
      const parsed = JSON.parse(
        git(['show', `${ref}:${relPath}`]),
      ) as Partial<RuleSchemaExceptions>;
      return { ref, present: true, entries: new Set(parsed.warnOnly ?? []) };
    } catch {
      return { ref, present: false, entries: new Set() };
    }
  }
  return null;
}

export interface WarnOnlyProblems {
  /** Entries absent from the baseline — the list grew. */
  added: string[];
  /** Entries that no longer name a feature file on disk. */
  dangling: string[];
  /** Checked entries with no findings left — the improvement is not locked in. */
  stale: string[];
}

/**
 * The ways a warn-only list rots. It is a ratchet in both directions: a PR may
 * not exempt a file the integration branch gates, and a file that has been
 * reconciled must leave the list so it cannot regress unnoticed.
 *
 * With no resolvable baseline every entry counts as added, so the check fails
 * closed. When the baseline ref resolves but predates the exception file, the
 * change under test is the one introducing it, and its entries are accepted as
 * the starting point.
 */
export function checkWarnOnlyList(
  warnOnly: string[],
  baseline: WarnOnlyBaseline | null,
  checkedFiles: ReadonlySet<string>,
  filesWithFindings: ReadonlySet<string>,
): WarnOnlyProblems {
  const { dangling } = checkExceptionList(warnOnly, new Set(warnOnly));
  const added =
    baseline === null
      ? [...warnOnly]
      : baseline.present
        ? warnOnly.filter((rel) => !baseline.entries.has(rel))
        : [];
  const stale = warnOnly.filter(
    (rel) => checkedFiles.has(rel) && !filesWithFindings.has(rel),
  );
  return { added, dangling, stale };
}
