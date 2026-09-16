/**
 * Step-file checks for the EARS spec audit.
 *
 * The feature checks in `spec-audit.ts` hold requirements to EARS. These hold
 * the step files that execute them to one shape: one step per file, in a
 * directory named for its keyword, in a file named after its pattern. That is
 * what makes a step findable from the feature text and reusable instead of
 * copied.
 *
 * Matching steps against features (missing, ambiguous and unused steps) is
 * not done here. It needs the patterns compiled exactly as the runner compiles
 * them, so it lives in the runner's own dry run,
 * `tests/bdd/specs/step-library.spec.ts`. This module reads source files with
 * the TypeScript parser and never executes them.
 *
 * Legacy `defineFeature` step files, one per feature with every step inline,
 * are listed in `spec-audit-exceptions.json` under `legacyStepFiles`. The list
 * ratchets like `unconverted`: it only shrinks.
 *
 * Imports no ESM, so the audit's unit tests can load it under Jest.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export type StepCheck =
  | 'step-file-location'
  | 'step-file-count'
  | 'step-file-keyword'
  | 'step-file-pattern'
  | 'step-file-name'
  | 'step-near-duplicate'
  | 'legacy-step-file-unlisted'
  | 'legacy-step-file-added'
  | 'legacy-step-file-dangling'
  | 'feature-unbound'
  | 'feature-bound-twice'
  | 'spec-without-feature';

export interface StepFinding {
  check: StepCheck;
  /** Repository-relative, forward slashes. */
  file: string;
  line?: number;
  message: string;
}

export interface LegacyStepFiles {
  /** `legacyStepFiles` in the working copy's exception file. */
  listed: readonly string[];
  /**
   * The same list on the integration branch. Null when the branch's exception
   * file predates the key, which only happens while the key is introduced.
   */
  baseline: ReadonlySet<string> | null;
}

const KEYWORDS = ['Given', 'When', 'Then'] as const;
type Keyword = (typeof KEYWORDS)[number];

/** Longest file name, before `.ts`, a step pattern produces. */
export const MAX_STEP_FILE_NAME = 96;

const BDD = 'tests/bdd';
const STEPS = `${BDD}/steps`;
const SPECS = `${BDD}/specs`;
const FEATURES = `${BDD}/features`;
const LEGACY = `${BDD}/step-definitions`;

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

function walk(
  root: string,
  rel: string,
  keep: (name: string) => boolean,
): string[] {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(abs).sort()) {
    const childRel = `${rel}/${entry}`;
    if (statSync(path.join(root, childRel)).isDirectory()) {
      found.push(...walk(root, childRel, keep));
    } else if (keep(entry)) {
      found.push(childRel);
    }
  }
  return found;
}

// ---------------------------------------------------------------------------
// Reading step files
// ---------------------------------------------------------------------------

export interface StaticPattern {
  kind: 'string' | 'regexp';
  /** The string's value, or the regular expression's source without slashes. */
  text: string;
}

interface StepCall {
  keyword: Keyword;
  pattern: StaticPattern | null;
  line: number;
}

function parse(root: string, rel: string): ts.SourceFile {
  return ts.createSourceFile(
    rel,
    readFileSync(path.join(root, rel), 'utf-8'),
    ts.ScriptTarget.Latest,
    true,
  );
}

function lineOf(source: ts.SourceFile, node: ts.Node): number {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

function staticPattern(node: ts.Expression | undefined): StaticPattern | null {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return { kind: 'string', text: node.text };
  }
  if (ts.isRegularExpressionLiteral(node)) {
    return {
      kind: 'regexp',
      text: node.text.slice(1, node.text.lastIndexOf('/')),
    };
  }
  return null;
}

function stepCalls(source: ts.SourceFile): StepCall[] {
  const calls: StepCall[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      (KEYWORDS as readonly string[]).includes(node.expression.text)
    ) {
      calls.push({
        keyword: node.expression.text as Keyword,
        pattern: staticPattern(node.arguments[0]),
        line: lineOf(source, node),
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return calls;
}

function loadFeatureArgument(source: ts.SourceFile): string | null {
  let found: string | null = null;
  const visit = (node: ts.Node): void => {
    if (
      found === null &&
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'loadFeature'
    ) {
      const pattern = staticPattern(node.arguments[0]);
      if (pattern?.kind === 'string') found = pattern.text;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------

/**
 * The file name a step pattern belongs in: its words, lower-cased and joined
 * with hyphens, cut at a word boundary to `MAX_STEP_FILE_NAME`. Parameter
 * types keep their names (`{int}` gives `int`); regular expression escapes
 * such as `\d` are dropped.
 */
export function stepFileName(pattern: StaticPattern): string {
  const text =
    pattern.kind === 'regexp'
      ? pattern.text.replace(/\\[a-zA-Z]/g, ' ')
      : pattern.text;
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  let name = '';
  for (const word of words) {
    const next = name ? `${name}-${word}` : word;
    if (next.length > MAX_STEP_FILE_NAME) break;
    name = next;
  }
  return name;
}

/**
 * A string pattern with its literal values generalised: numbers and quoted
 * strings become placeholders, as do the parameter types that would match
 * them. Two steps that agree after this differ only in data, so they should
 * be one parameterised step.
 */
export function normaliseStepText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\{(?:int|float)\}|-?\d*\.?\d+/g, '{number}')
    .replace(/\{string\}|"[^"]*"|'[^']*'/g, '{string}')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

function checkStepFiles(root: string): StepFinding[] {
  const findings: StepFinding[] = [];
  const byNormalisedText = new Map<string, string[]>();

  for (const file of walk(root, STEPS, (name) => name.endsWith('.ts'))) {
    const parts = file.slice(STEPS.length + 1).split('/');
    const directory = parts.length === 2 ? parts[0] : null;
    const expected = KEYWORDS.find((k) => k.toLowerCase() === directory);
    if (!expected) {
      findings.push({
        check: 'step-file-location',
        file,
        message:
          'Step files live directly in tests/bdd/steps/given, when or then, ' +
          'the directory named for the keyword the file registers.',
      });
    }

    const source = parse(root, file);
    const calls = stepCalls(source);
    const call = calls[0];
    if (!call || calls.length > 1) {
      findings.push({
        check: 'step-file-count',
        file,
        line: calls[1]?.line,
        message:
          `Defines ${calls.length} steps. A step file defines exactly one ` +
          'step; split it, one file per step.',
      });
      continue;
    }

    if (expected && call.keyword !== expected) {
      findings.push({
        check: 'step-file-keyword',
        file,
        line: call.line,
        message: `Registers a ${call.keyword} step in the ${directory}/ directory. Move it to ${call.keyword.toLowerCase()}/.`,
      });
    }

    if (!call.pattern) {
      findings.push({
        check: 'step-file-pattern',
        file,
        line: call.line,
        message:
          'The step pattern must be a string or regular expression literal, ' +
          'so the step can be found from the feature text without running it.',
      });
      continue;
    }

    const name = stepFileName(call.pattern);
    if (path.posix.basename(file, '.ts') !== name) {
      findings.push({
        check: 'step-file-name',
        file,
        line: call.line,
        message: `A step file is named after its pattern: rename it to ${name}.ts.`,
      });
    }

    if (call.pattern.kind === 'string') {
      const key = normaliseStepText(call.pattern.text);
      byNormalisedText.set(key, [...(byNormalisedText.get(key) ?? []), file]);
    }
  }

  for (const files of byNormalisedText.values()) {
    if (files.length < 2) continue;
    for (const file of files) {
      findings.push({
        check: 'step-near-duplicate',
        file,
        message:
          `Differs only in literal values from ${files.filter((f) => f !== file).join(', ')}. ` +
          'Replace them with one step that takes {int}, {float} or {string}.',
      });
    }
  }

  return findings;
}

function checkLegacyStepFiles(
  root: string,
  legacy: LegacyStepFiles,
): StepFinding[] {
  const findings: StepFinding[] = [];
  const onDisk = walk(root, LEGACY, (name) => name.endsWith('.steps.ts'));
  const listed = new Set(legacy.listed);

  for (const file of onDisk) {
    if (!listed.has(file)) {
      findings.push({
        check: 'legacy-step-file-unlisted',
        file,
        message:
          'A multi-step defineFeature file that legacyStepFiles does not list. ' +
          'New steps go in tests/bdd/steps, one per file, with a spec entry ' +
          'in tests/bdd/specs binding the feature.',
      });
    }
  }

  for (const file of legacy.listed) {
    if (!onDisk.includes(file)) {
      findings.push({
        check: 'legacy-step-file-dangling',
        file,
        message:
          'Listed in legacyStepFiles but not on disk. Remove the entry; the ' +
          'list must shrink as domains convert.',
      });
    }
    if (legacy.baseline && !legacy.baseline.has(file)) {
      findings.push({
        check: 'legacy-step-file-added',
        file,
        message:
          'Added to legacyStepFiles. The list only shrinks: write the steps ' +
          'in tests/bdd/steps instead.',
      });
    }
  }

  return findings;
}

function checkFeatureBindings(root: string): StepFinding[] {
  const findings: StepFinding[] = [];
  const bindings = new Map<string, string[]>();
  const bind = (feature: string, by: string) =>
    bindings.set(feature, [...(bindings.get(feature) ?? []), by]);

  for (const spec of walk(root, SPECS, (name) =>
    /^\d{4}-.*\.spec\.ts$/.test(name),
  )) {
    const feature = `${FEATURES}/${spec.slice(SPECS.length + 1).replace(/\.spec\.ts$/, '.feature')}`;
    if (!existsSync(path.join(root, feature))) {
      findings.push({
        check: 'spec-without-feature',
        file: spec,
        message: `Binds ${feature}, which does not exist. A spec entry mirrors its feature's path.`,
      });
    }
    bind(feature, spec);
  }

  for (const legacy of walk(root, LEGACY, (name) =>
    name.endsWith('.steps.ts'),
  )) {
    const feature = loadFeatureArgument(parse(root, legacy));
    if (feature) bind(toPosix(path.posix.normalize(feature)), legacy);
  }

  for (const feature of walk(root, FEATURES, (name) =>
    name.endsWith('.feature'),
  )) {
    const by = bindings.get(feature) ?? [];
    if (by.length === 0) {
      findings.push({
        check: 'feature-unbound',
        file: feature,
        message:
          'No spec entry or step file runs this feature, so none of its ' +
          `scenarios execute. Add ${feature.replace(FEATURES, SPECS).replace(/\.feature$/, '.spec.ts')}.`,
      });
    } else if (by.length > 1) {
      findings.push({
        check: 'feature-bound-twice',
        file: feature,
        message: `Run by ${by.join(' and ')}. Delete the legacy step file once the spec entry exists.`,
      });
    }
  }

  return findings;
}

/** Every step-file finding for the BDD tree under `root`. */
export function auditStepLayout(
  root: string,
  legacy: LegacyStepFiles,
): StepFinding[] {
  return [
    ...checkStepFiles(root),
    ...checkLegacyStepFiles(root, legacy),
    ...checkFeatureBindings(root),
  ];
}
