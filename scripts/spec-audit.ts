/**
 * EARS/Gherkin specification audit.
 *
 * The BDD suite is meant to be an executable specification, not just a pile of
 * tests. That only holds if every requirement is stated in one place, in one
 * form, and is actually testable. This script enforces that shape:
 *
 *   - Every `Rule:` title IS an atomic EARS requirement (exactly one "shall").
 *   - Every Feature states at least one Rule, and every Scenario lives under
 *     the Rule it verifies.
 *   - Requirement text is free of vague, unmeasurable, or escape-clause
 *     language, and follows EARS grammar for If/While/When/Where.
 *
 * Ported from the hermes project's audit.py, but parsing the real Gherkin AST
 * via @cucumber/gherkin rather than matching lines with regexes, so `Rule:`
 * nesting, descriptions and Scenario Outlines are understood structurally.
 *
 * The requirement-language and exception-list checks live in
 * `spec-audit-checks.ts`, which imports no ESM, so the audit's own unit tests
 * can load them under Jest. This file owns the AST walk and the CLI.
 *
 * Usage: npx ts-node scripts/spec-audit.ts [paths...] [--verbose]
 *        npm run spec:audit
 *
 * Reads `scripts/spec-audit-exceptions.json`. Files listed there are not yet
 * converted to Rule form and are skipped — but the allowlist is a ratchet, so
 * the run also fails when an entry is added relative to the integration
 * branch, when a listed file now passes cleanly, or when a listed path no
 * longer names a feature file. The list can therefore only shrink.
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

import {
  REPO_ROOT,
  checkEarsPatternStructure,
  checkExceptionList,
  checkMissingSystemName,
  countShall,
  findVagueTerms,
  findWrongObligationKeywords,
  loadBaselineExceptions,
  loadExceptions,
} from './spec-audit-checks';

const DEFAULT_PATHS = ['tests/bdd/features'];

const IS_CI = process.env.GITHUB_ACTIONS === 'true';

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

  // A Feature with no Rule blocks states no requirement, so there is nothing
  // for its scenarios to be traceable to — and before this check it passed the
  // audit silently.
  if (ruleCount === 0) {
    findings.push({
      file,
      line: feature.location.line,
      message:
        `Feature '${feature.name}' contains no Rule blocks. Every feature ` +
        'must state at least one EARS requirement as a Rule title.',
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
// Path resolution and reporting
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

  const { added: addedExceptions, dangling: danglingExceptions } =
    exceptions.unconverted.length > 0
      ? checkExceptionList(
          exceptions.unconverted,
          loadBaselineExceptions().entries,
        )
      : { added: [], dangling: [] };

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

  for (const rel of addedExceptions) {
    const message =
      `${rel} was added to spec-audit-exceptions.json. The exception list is ` +
      'a ratchet: entries may only be removed. Make the feature Rule-compliant ' +
      'rather than exempting it.';
    console.error(`\n  [ERROR] ${message}`);
    annotate('error', message, 'scripts/spec-audit-exceptions.json');
  }

  for (const rel of danglingExceptions) {
    const message =
      `${rel} is listed in spec-audit-exceptions.json but no such .feature ` +
      'file exists. Remove the stale entry.';
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

  const badExceptions =
    staleExceptions.length + addedExceptions.length + danglingExceptions.length;

  if (totalFindings > 0 || badExceptions > 0) {
    console.error(
      `\nFAIL: ${totalFindings} finding(s) across ${failing.length} file(s)` +
        (badExceptions > 0
          ? `, ${badExceptions} exception-list problem(s)`
          : '') +
        '.',
    );
    process.exit(1);
  }

  console.log('\nPASS: specification is EARS-compliant.');
}

main();
