/**
 * npm run lint:workflows
 *
 * Runs zizmor over `.github/`, the same audit `ci.yml`'s `zizmor` job runs.
 *
 * It was CI-only until 2026-09-18, and in one afternoon it caught two real
 * design problems that had passed every other gate: a release-triggered
 * workflow enabling npm's shared cache, where a cached copy of the package
 * could have satisfied the post-publish canary's install and had it verify
 * bytes the registry never sent; and a `workflow_run` trigger that needed
 * justifying. Both took seconds to find and a round-trip through CI to learn
 * about.
 *
 * The version comes out of ci.yml rather than being written twice. A local
 * audit running a different zizmor from the one that gates the pull request is
 * a local audit that can disagree with CI for no reason anybody can see.
 */
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const CI = '.github/workflows/ci.yml';

/** The `uvx zizmor@X.Y.Z` pin in ci.yml, so the two cannot drift. */
export function pinnedVersion(ciYaml: string): string {
  const match = /uvx\s+zizmor@(\d+\.\d+\.\d+)/.exec(ciYaml);
  if (!match?.[1]) {
    throw new Error(
      `No "uvx zizmor@<version>" in ${CI}. The local audit takes its version from there; ` +
        'if the job changed, update this script to match.',
    );
  }
  return match[1];
}

function has(command: string): boolean {
  const probe = spawnSync(command, ['--version'], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  return !probe.error && probe.status === 0;
}

function main(): void {
  const version = pinnedVersion(readFileSync(path.join(ROOT, CI), 'utf8'));
  const args = ['--config', '.zizmor.yml', '.github/'];

  // uvx first: it pins the version, which a zizmor already on PATH does not.
  const runner = has('uvx')
    ? { command: 'uvx', args: [`zizmor@${version}`, ...args] }
    : has('zizmor')
      ? { command: 'zizmor', args }
      : undefined;

  if (!runner) {
    console.error(
      'Neither uvx nor zizmor is on PATH, so the workflow audit cannot run.\n' +
        '  Install uv:  https://docs.astral.sh/uv/getting-started/installation/\n' +
        `  Or zizmor:   pipx install zizmor==${version}\n` +
        'This is the same audit the `zizmor` job runs on every pull request.',
    );
    process.exit(2);
  }

  if (runner.command === 'zizmor') {
    console.log(
      `Using zizmor from PATH. ci.yml pins ${version}; check yours matches if the audit disagrees with CI.`,
    );
  }

  const result = spawnSync(runner.command, runner.args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

if (require.main === module) main();
