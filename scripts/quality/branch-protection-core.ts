/**
 * The check behind CHARTER PROC-03: `master` accepts changes only through a
 * pull request that passes `ci-success`.
 *
 * Branch protection is a repository setting, so nothing in the tree can show
 * it holds. `scripts/quality/branch-protection.ts` reads the setting through
 * the GitHub API every week (`maintenance.yml`) and fails when it drifts.
 *
 * Two responses feed it. `GET /repos/{repo}/branches/master` needs only
 * `contents: read` and gives whether the branch is protected and which checks
 * are required. `GET /repos/{repo}/branches/master/protection` adds the
 * pull-request requirement, strict (up to date with the base) and force
 * pushes, but needs an admin token, so the workflow's token gets a 403 and
 * those three are reported as unchecked rather than passed.
 *
 * Administrators are exempt from protection today (`enforcement_level:
 * non_admins`); that gap is SEC-07's, so it is a note here, not a failure.
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */

/** The check every change to `master` must pass. */
export const REQUIRED_CHECK = 'ci-success';

interface StatusChecks {
  contexts?: string[];
  checks?: { context?: string }[];
  enforcement_level?: string;
  strict?: boolean;
}

/** The parts of `GET /repos/{repo}/branches/{branch}` this check reads. */
export interface BranchResponse {
  protected?: boolean;
  protection?: {
    enabled?: boolean;
    required_status_checks?: StatusChecks;
  };
}

/** The parts of `GET /repos/{repo}/branches/{branch}/protection` it reads. */
export interface ProtectionResponse {
  required_status_checks?: StatusChecks | null;
  required_pull_request_reviews?: object | null;
  allow_force_pushes?: { enabled?: boolean };
}

function requiredChecks(checks: StatusChecks | null | undefined): string[] {
  if (!checks) return [];
  return [
    ...(checks.contexts ?? []),
    ...(checks.checks ?? []).flatMap((c) => (c.context ? [c.context] : [])),
  ];
}

/**
 * What is wrong with the branch's protection, one line per problem; empty
 * when it holds. `protection` is the admin response, or `null` when the token
 * could not read it.
 */
export function protectionProblems(
  branch: BranchResponse,
  protection: ProtectionResponse | null,
): string[] {
  if (branch.protected !== true || branch.protection?.enabled !== true) {
    return ['master is not a protected branch'];
  }
  const problems: string[] = [];
  const status = branch.protection.required_status_checks;
  if (status?.enforcement_level === 'off') {
    problems.push('required status checks are switched off');
  }
  if (!requiredChecks(status).includes(REQUIRED_CHECK)) {
    problems.push(`${REQUIRED_CHECK} is not a required status check`);
  }
  if (protection) {
    if (!protection.required_pull_request_reviews) {
      problems.push('master does not require a pull request');
    }
    if (protection.required_status_checks?.strict !== true) {
      problems.push('a pull request need not be up to date with master');
    }
    if (protection.allow_force_pushes?.enabled !== false) {
      problems.push('force pushes to master are allowed');
    }
  }
  return problems;
}

/**
 * What the check could not establish or knowingly lets through, one line
 * each. Printed as warnings so a green run does not read as a full pass.
 */
export function protectionNotes(
  branch: BranchResponse,
  protection: ProtectionResponse | null,
): string[] {
  const notes: string[] = [];
  if (!protection) {
    notes.push(
      'not checked: the pull-request requirement, strict status checks and ' +
        'force pushes (the protection endpoint needs an admin token)',
    );
  }
  if (
    branch.protection?.required_status_checks?.enforcement_level ===
    'non_admins'
  ) {
    notes.push(
      'administrators are exempt from the required checks (SEC-07, guides/SECURITY.md §5)',
    );
  }
  return notes;
}
