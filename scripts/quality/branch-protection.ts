/**
 * Reads the protection of `master` through the GitHub API and fails when it
 * no longer matches CHARTER PROC-03. The rules are in
 * `branch-protection-core.ts`.
 *
 * Usage: GH_TOKEN=... npx ts-node scripts/quality/branch-protection.ts
 * Environment: GITHUB_REPOSITORY (default lgriffin/ESI.ts), GITHUB_API_URL.
 * Exit code 0 when it holds, 1 on a problem, 2 when the API cannot be read.
 */
import {
  BranchResponse,
  ProtectionResponse,
  protectionNotes,
  protectionProblems,
  REQUIRED_CHECK,
} from './branch-protection-core';

const API = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const REPO = process.env.GITHUB_REPOSITORY ?? 'lgriffin/ESI.ts';
const TOKEN = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;

async function get(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
}

async function main(): Promise<number> {
  const base = `${API}/repos/${REPO}/branches/master`;
  const branchRes = await get(base);
  if (!branchRes.ok) {
    console.error(`Cannot read ${base}: HTTP ${branchRes.status}`);
    return 2;
  }
  const branch = (await branchRes.json()) as BranchResponse;

  // Needs an admin token; the workflow's token gets 403 or 404.
  const protectionRes = await get(`${base}/protection`);
  const protection = protectionRes.ok
    ? ((await protectionRes.json()) as ProtectionResponse)
    : null;
  for (const note of protectionNotes(branch, protection)) {
    console.log(`::warning::${note}`);
  }

  const problems = protectionProblems(branch, protection);
  if (problems.length === 0) {
    console.log(
      `PASS: master on ${REPO} is protected and requires ${REQUIRED_CHECK}` +
        (protection
          ? ' through a pull request.'
          : '; see the warnings for what was not checked.'),
    );
    return 0;
  }
  for (const problem of problems) console.error(`::error::${problem}`);
  console.error(`FAIL: master on ${REPO} has drifted from CHARTER PROC-03.`);
  return 1;
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error);
    process.exit(2);
  },
);
