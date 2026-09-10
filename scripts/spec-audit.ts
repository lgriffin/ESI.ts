/**
 * EARS/Gherkin specification audit.
 *
 * The BDD suite is meant to be an executable specification, not just a pile of
 * tests. That only holds if every requirement is stated in one place, in one
 * form, and is actually testable. This script enforces that shape:
 *
 *   - Every `Rule:` title IS an atomic EARS requirement (exactly one "shall").
 *   - Every Scenario lives under the Rule it verifies.
 *   - Requirement text is free of vague, unmeasurable, or escape-clause
 *     language, and follows EARS grammar for If/While/When/Where.
 *
 * Ported from the hermes project's audit.py, but parsing the real Gherkin AST
 * via @cucumber/gherkin rather than matching lines with regexes, so `Rule:`
 * nesting, descriptions and Scenario Outlines are understood structurally.
 *
 * Usage: npx ts-node scripts/spec-audit.ts [paths...] [--verbose]
 *        npm run spec:audit
 *
 * Reads `scripts/spec-audit-exceptions.json`. Files listed there are not yet
 * converted to Rule form and are skipped — but the allowlist is a ratchet: a
 * listed file that now passes cleanly fails the run until it is removed, so
 * the exception list can only shrink.
 *
 * Exit code 0 on pass, 1 on any finding.
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import * as path from 'path';
import {
  Parser,
  AstBuilder,
  GherkinClassicTokenMatcher,
} from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';
import type { Feature, Rule, Scenario } from '@cucumber/messages';

const EXCEPTIONS_PATH = path.resolve(__dirname, 'spec-audit-exceptions.json');
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_PATHS = ['tests/bdd/features'];

const IS_CI = process.env.GITHUB_ACTIONS === 'true';

// ---------------------------------------------------------------------------
// Requirement language rules
// ---------------------------------------------------------------------------

/**
 * Words that make a requirement untestable. A requirement containing any of
 * these cannot be verified, because two readers will disagree on whether the
 * system met it.
 */
const VAGUE_TERMS: Record<string, string[]> = {
  'vague adverb': [
    'quickly',
    'slowly',
    'efficiently',
    'properly',
    'reasonably',
    'approximately',
    'usually',
    'typically',
    'generally',
    'soon',
    'eventually',
    'immediately',
    'gracefully',
    'correctly',
    'appropriately',
  ],
  'unmeasurable adjective': [
    'user-friendly',
    'flexible',
    'intuitive',
    'robust',
    'scalable',
    'efficient',
    'seamless',
    'responsive',
    'reliable',
    'powerful',
    'smart',
    'easy-to-use',
    'graceful',
  ],
  'vague quantifier': [
    'various',
    'some',
    'many',
    'few',
    'several',
    'most',
    'a lot',
  ],
  'escape clause': [
    'as appropriate',
    'if possible',
    'as needed',
    'where practical',
    'to the extent feasible',
    'if necessary',
    'when applicable',
  ],
  'continuation term': ['etc.', 'and so on', 'and/or', 'such as'],
  'indefinite temporal term': [
    'timely',
    'in a timely manner',
    'in real time',
    'promptly',
    'without delay',
    'as soon as possible',
    'periodic',
  ],
};

/** EARS reserves "shall" for mandatory behaviour; these dilute it. */
const WRONG_OBLIGATION_KEYWORDS = ['should', 'may', 'will', 'must'];

/** A requirement must name the system it constrains, not point at it. */
const PRONOUNS_BEFORE_SHALL = ['it', 'they', 'he', 'she', 'we', 'you'];

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

interface Finding {
  file: string;
  line: number | null;
  message: string;
}

interface FileReport {
  file: string;
  findings: Finding[];
  ruleCount: number;
  scenarioCount: number;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findWrongObligationKeywords(title: string): string[] {
  const pattern = new RegExp(
    `\\b(${WRONG_OBLIGATION_KEYWORDS.join('|')})\\b`,
    'gi',
  );
  const matches = title.match(pattern) ?? [];
  return [...new Set(matches.map((m) => m.toLowerCase()))].sort();
}

function findVagueTerms(title: string): Array<[string, string]> {
  const found: Array<[string, string]> = [];
  for (const [category, terms] of Object.entries(VAGUE_TERMS)) {
    for (const term of terms) {
      const escaped = escapeRegExp(term);
      // A trailing "." already terminates the word, so no closing boundary.
      const pattern = term.endsWith('.')
        ? new RegExp(`\\b${escaped}`, 'i')
        : new RegExp(`\\b${escaped}\\b`, 'i');
      if (pattern.test(title)) {
        found.push([term, category]);
      }
    }
  }
  return found;
}

/**
 * Check EARS structural grammar.
 *
 * The templates are:
 *   If <condition>, then the <system> shall <response>.
 *   While <state>, the <system> shall <response>.
 *   When <trigger>, the <system> shall <response>.
 *   Where <feature is included>, the <system> shall <response>.
 */
function checkEarsPatternStructure(title: string): string[] {
  const errors: string[] = [];
  const lower = title.toLowerCase();

  if (/^\s*if\b/.test(lower)) {
    const shallPos = lower.indexOf('shall');
    const thenMatch = /\bthen\b/.exec(lower);
    const thenPos = thenMatch ? thenMatch.index : -1;
    if (shallPos !== -1 && (thenPos === -1 || thenPos > shallPos)) {
      errors.push(
        "EARS 'If' pattern requires 'then' before 'shall' " +
          '(template: If <condition>, then the <system> shall <response>).',
      );
    }
  }

  for (const keyword of ['while', 'when', 'where']) {
    if (new RegExp(`^\\s*${keyword}\\b`).test(lower)) {
      const keywordEnd = lower.indexOf(keyword) + keyword.length;
      const beforeShall = lower.includes('shall')
        ? lower.slice(0, lower.indexOf('shall'))
        : lower;
      if (!beforeShall.slice(keywordEnd).includes(',')) {
        const capitalised = keyword[0]!.toUpperCase() + keyword.slice(1);
        errors.push(
          `EARS '${capitalised}' clause should be followed by a comma before ` +
            `the system name (template: ${capitalised} <clause>, the <system> ` +
            `shall <response>).`,
        );
      }
      break;
    }
  }

  return errors;
}

function checkMissingSystemName(title: string): string[] {
  const pattern = new RegExp(
    `\\b(${PRONOUNS_BEFORE_SHALL.join('|')})\\s+shall\\b`,
    'i',
  );
  const match = pattern.exec(title);
  if (match) {
    return [
      `Pronoun '${match[1]!.toLowerCase()}' found before 'shall' — use an ` +
        'explicit system name.',
    ];
  }
  return [];
}

function countShall(text: string): number {
  return (text.match(/\bshall\b/gi) ?? []).length;
}

// ---------------------------------------------------------------------------
// Rule and file auditing
// ---------------------------------------------------------------------------

function auditRule(rule: Rule, file: string, findings: Finding[]): number {
  const title = rule.name.trim();
  const line = rule.location.line;
  const prefix = `Rule '${title}':`;
  const add = (message: string): void => {
    findings.push({ file, line, message: `${prefix} ${message}` });
  };

  const shallCount = countShall(title);
  if (shallCount === 0) {
    add("Rule title must be an EARS requirement (must contain 'shall').");
  } else if (shallCount > 1) {
    add(
      `Rule title contains ${shallCount} occurrences of 'shall'. EARS ` +
        "requirements must be atomic — use exactly one 'shall' per Rule.",
    );
  }

  const wrongKeywords = findWrongObligationKeywords(title);
  if (wrongKeywords.length > 0) {
    add(
      `Rule title uses non-standard obligation keyword(s): ` +
        `${wrongKeywords.join(', ')}. Use 'shall' for mandatory requirements.`,
    );
  }

  for (const [term, category] of findVagueTerms(title)) {
    add(
      `Rule title contains vague language: '${term}' (${category}). ` +
        'Replace with a specific, measurable value.',
    );
  }

  for (const error of checkEarsPatternStructure(title)) {
    add(error);
  }
  for (const error of checkMissingSystemName(title)) {
    add(error);
  }

  // A requirement buried in the prose is a requirement nobody can trace to a
  // scenario, so the description must explain the rationale and nothing more.
  const descriptionShallLines = rule.description
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && countShall(l) > 0);
  if (descriptionShallLines.length > 0) {
    add(
      `Description contains ${descriptionShallLines.length} EARS ` +
        'requirement(s). Additional requirements must not appear in the ' +
        'description — move each to its own Rule title.',
    );
  }

  const scenarios = rule.children.filter((c) => c.scenario).length;
  if (scenarios === 0) {
    add('No scenarios found under this rule.');
  }
  return scenarios;
}

function auditFeature(feature: Feature, file: string): FileReport {
  const findings: Finding[] = [];
  let ruleCount = 0;
  let scenarioCount = 0;

  const orphanScenarios: Scenario[] = [];

  for (const child of feature.children) {
    if (child.rule) {
      ruleCount += 1;
      scenarioCount += auditRule(child.rule, file, findings);
    } else if (child.scenario) {
      orphanScenarios.push(child.scenario);
    }
  }

  if (orphanScenarios.length > 0) {
    scenarioCount += orphanScenarios.length;
    findings.push({
      file,
      line: orphanScenarios[0]!.location.line,
      message:
        `Found ${orphanScenarios.length} scenario(s) outside of any Rule ` +
        'block. Every scenario must verify a stated EARS requirement: ' +
        `${orphanScenarios.map((s) => s.name).join(', ')}`,
    });
  }

  if (feature.description.trim().length === 0) {
    findings.push({
      file,
      line: feature.location.line,
      message:
        `Feature '${feature.name}' has no description. Describe what this ` +
        'feature covers and why, so the specification reads as documentation.',
    });
  }

  return { file, findings, ruleCount, scenarioCount };
}

function auditFile(absPath: string, relPath: string): FileReport {
  const parser = new Parser(
    new AstBuilder(IdGenerator.uuid()),
    new GherkinClassicTokenMatcher(),
  );
  let document;
  try {
    document = parser.parse(readFileSync(absPath, 'utf-8'));
  } catch (error) {
    return {
      file: relPath,
      findings: [
        {
          file: relPath,
          line: null,
          message: `Failed to parse Gherkin: ${(error as Error).message}`,
        },
      ],
      ruleCount: 0,
      scenarioCount: 0,
    };
  }

  if (!document.feature) {
    return {
      file: relPath,
      findings: [
        { file: relPath, line: null, message: 'File contains no Feature.' },
      ],
      ruleCount: 0,
      scenarioCount: 0,
    };
  }

  return auditFeature(document.feature, relPath);
}

// ---------------------------------------------------------------------------
// Path resolution and exceptions
// ---------------------------------------------------------------------------

function collectFeatureFiles(target: string): string[] {
  const abs = path.resolve(REPO_ROOT, target);
  if (!existsSync(abs)) {
    console.error(`Warning: '${target}' does not exist, skipping.`);
    return [];
  }
  if (statSync(abs).isFile()) {
    return abs.endsWith('.feature') ? [abs] : [];
  }
  const found: string[] = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const child = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectFeatureFiles(child));
    } else if (entry.isFile() && entry.name.endsWith('.feature')) {
      found.push(child);
    }
  }
  return found.sort();
}

interface Exceptions {
  /** Feature files not yet converted to Rule form. Ratcheted: can only shrink. */
  unconverted: string[];
}

function loadExceptions(): Exceptions {
  if (!existsSync(EXCEPTIONS_PATH)) {
    return { unconverted: [] };
  }
  const parsed = JSON.parse(readFileSync(EXCEPTIONS_PATH, 'utf-8')) as Partial<
    Exceptions & { $comment?: string }
  >;
  return { unconverted: parsed.unconverted ?? [] };
}

function annotate(
  level: 'error' | 'warning',
  message: string,
  file?: string,
  line?: number | null,
): void {
  if (!IS_CI) return;
  const params: string[] = [];
  if (file) params.push(`file=${file}`);
  if (line) params.push(`line=${line}`);
  const paramStr = params.length > 0 ? ` ${params.join(',')}` : '';
  // Annotations are newline-delimited, so collapse any embedded newlines.
  console.log(`::${level}${paramStr}::${message.replace(/\n/g, ' ')}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v') || IS_CI;
  const targets = args.filter((a) => !a.startsWith('-'));
  const paths = targets.length > 0 ? targets : DEFAULT_PATHS;

  const files = paths.flatMap(collectFeatureFiles);
  if (files.length === 0) {
    console.error('No .feature files found.');
    process.exit(1);
  }

  // Converting a file is a two-step edit: fix the feature, then drop its
  // exception entry. --ignore-exceptions lets the first step be checked on its
  // own, which also keeps parallel conversions off the shared exception file.
  const ignoreExceptions = args.includes('--ignore-exceptions');
  const exceptions = ignoreExceptions ? { unconverted: [] } : loadExceptions();
  const unconverted = new Set(exceptions.unconverted);

  const reports: FileReport[] = [];
  const skipped: string[] = [];
  const staleExceptions: string[] = [];

  for (const abs of files) {
    const rel = path.relative(REPO_ROOT, abs);
    const report = auditFile(abs, rel);
    if (unconverted.has(rel)) {
      // Still allowlisted — but if it now passes, the entry must come out so
      // the file cannot silently regress later.
      if (report.findings.length === 0) {
        staleExceptions.push(rel);
      } else {
        skipped.push(rel);
      }
      continue;
    }
    reports.push(report);
  }

  const failing = reports.filter((r) => r.findings.length > 0);
  const passing = reports.filter((r) => r.findings.length === 0);

  for (const report of failing) {
    console.error(`\n--- ${report.file} ---`);
    for (const finding of report.findings) {
      const at = finding.line ? `:${finding.line}` : '';
      console.error(`  [ERROR]${at} ${finding.message}`);
      annotate('error', finding.message, finding.file, finding.line);
    }
  }

  for (const rel of staleExceptions) {
    const message =
      `${rel} is listed in spec-audit-exceptions.json but now passes the ` +
      'audit. Remove it from the exception list to lock the improvement in.';
    console.error(`\n  [ERROR] ${message}`);
    annotate('error', message, 'scripts/spec-audit-exceptions.json');
  }

  const totalFindings = failing.reduce((n, r) => n + r.findings.length, 0);

  console.log('\n--- Summary ---');
  console.log(`Files audited:  ${reports.length}`);
  console.log(`  passing:      ${passing.length}`);
  console.log(`  failing:      ${failing.length}`);
  if (skipped.length > 0) {
    console.log(`Files skipped:  ${skipped.length} (awaiting conversion)`);
  }
  if (verbose) {
    const rules = reports.reduce((n, r) => n + r.ruleCount, 0);
    const scenarios = reports.reduce((n, r) => n + r.scenarioCount, 0);
    console.log(`EARS requirements: ${rules}`);
    console.log(`Scenarios:         ${scenarios}`);
    if (skipped.length > 0) {
      console.log('\nAwaiting conversion:');
      for (const rel of skipped) console.log(`  ${rel}`);
    }
  }

  if (totalFindings > 0 || staleExceptions.length > 0) {
    console.error(
      `\nFAIL: ${totalFindings} finding(s) across ${failing.length} file(s)` +
        (staleExceptions.length > 0
          ? `, ${staleExceptions.length} stale exception(s)`
          : '') +
        '.',
    );
    process.exit(1);
  }

  console.log('\nPASS: specification is EARS-compliant.');
}

main();
