/**
 * Charter audit: `guides/CHARTER.md` held to the rules the spec audit applies
 * to a `Rule:` block (CHARTER PROC-06).
 *
 * Every `####` requirement block must be well-formed EARS (one `shall`, a
 * named system, one of the five patterns, no vague language), and an Enforced
 * block must name a script, job or file that exists. The checks are in
 * `charter-audit-core.ts`, which the unit suite drives with fixtures; this
 * file gathers what exists and prints the findings.
 *
 * Usage: npm run charter:audit
 * Exit code 0 on pass, 1 on any finding, 2 when the charter cannot be read.
 */
import { execFileSync } from 'child_process';
import { readFileSync, readdirSync, existsSync } from 'fs';
import * as path from 'path';

import {
  Mechanisms,
  auditCharter,
  formatFindings,
  parseCharter,
} from './charter-audit-core';

const ROOT = path.resolve(__dirname, '..');
const CHARTER = 'guides/CHARTER.md';
const IS_CI = process.env.GITHUB_ACTIONS === 'true';

/** Job ids and display names across every workflow, plus the file names. */
function workflowMechanisms(): Pick<Mechanisms, 'jobs' | 'workflows'> {
  const dir = path.join(ROOT, '.github/workflows');
  const workflows = new Set<string>();
  const jobs = new Set<string>();
  for (const file of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
    workflows.add(file);
    const text = readFileSync(path.join(dir, file), 'utf-8');
    for (const m of text.matchAll(/^  ([A-Za-z0-9_-]+):\s*$/gm))
      jobs.add(m[1]!);
    for (const m of text.matchAll(/^    name:\s*(['"]?)(.+?)\1\s*$/gm))
      jobs.add(m[2]!);
  }
  return { jobs, workflows };
}

function main(): void {
  const charterPath = path.join(ROOT, CHARTER);
  if (!existsSync(charterPath)) {
    console.error(`FAIL: ${CHARTER} not found.`);
    process.exit(2);
  }
  const markdown = readFileSync(charterPath, 'utf-8');
  const pkg = JSON.parse(
    readFileSync(path.join(ROOT, 'package.json'), 'utf-8'),
  ) as { scripts?: Record<string, string> };
  const files = execFileSync('git', ['ls-files'], {
    cwd: ROOT,
    encoding: 'utf-8',
  })
    .split('\n')
    .filter((f) => f.length > 0);

  const blocks = parseCharter(markdown);
  if (blocks.length === 0) {
    console.error(`FAIL: no requirement block (####) found in ${CHARTER}.`);
    process.exit(2);
  }

  const findings = auditCharter(blocks, {
    scripts: new Set(Object.keys(pkg.scripts ?? {})),
    ...workflowMechanisms(),
    files,
  });

  const enforced = blocks.filter((b) => b.status === 'Enforced').length;
  console.log(
    `Charter audit: ${blocks.length} requirements, ${enforced} Enforced, ${findings.length} finding(s).`,
  );
  for (const line of formatFindings(findings, CHARTER)) console.log(line);
  if (IS_CI) {
    for (const f of findings) {
      console.log(
        `::error file=${CHARTER},line=${f.line}::${f.id} ${f.message}`,
      );
    }
  }
  if (findings.length > 0) {
    console.log(
      `\nFAIL: ${findings.length} requirement finding(s) in ${CHARTER} (PROC-06).`,
    );
    process.exit(1);
  }
  console.log(
    `PASS: every requirement in ${CHARTER} is well-formed EARS and every Enforced row names its mechanism.`,
  );
}

main();
