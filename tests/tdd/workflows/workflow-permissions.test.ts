/**
 * Token permissions and signed releases across .github/workflows (SEC-03,
 * SEC-04, SEC-06).
 *
 * OpenSSF Scorecard's Token-Permissions check scores zero when any workflow
 * leaves its top-level `permissions:` undeclared or grants write there, and
 * its Signed-Releases check looks for signature and provenance files among
 * the assets of the last five releases. zizmor audits some of this in CI, but
 * not as a list: a new job can still pick up a write scope without anyone
 * deciding it should. This file makes the list explicit, so adding a write
 * scope is an edit to WRITE_SCOPES that a reviewer sees, and removing one
 * keeps the list true.
 */
import { readFileSync, readdirSync } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const ROOT = path.resolve(__dirname, '../../..');
const WORKFLOWS = path.join(ROOT, '.github/workflows');

type Permissions = string | Record<string, string>;

interface Workflow {
  permissions?: Permissions;
  jobs?: Record<
    string,
    { permissions?: Permissions; steps?: Array<Record<string, unknown>> }
  >;
}

function workflowFiles(): string[] {
  return readdirSync(WORKFLOWS)
    .filter((f) => /\.ya?ml$/.test(f))
    .sort();
}

function load(file: string): Workflow {
  return yaml.load(
    readFileSync(path.join(WORKFLOWS, file), 'utf8'),
  ) as Workflow;
}

/**
 * Every job-level write scope in the repository, with the job that needs it.
 * The reason for each lives in a comment beside it in the workflow.
 */
const WRITE_SCOPES: Record<string, string[]> = {
  'ci.yml#coverage': ['pull-requests'],
  'codeql.yml#analyze': ['security-events'],
  'docs-site.yml#deploy': ['contents'],
  'nightly-audit.yml#audit': ['issues'],
  'nightly-benchmarks.yml#publish': ['contents'],
  'nightly-benchmarks.yml#report': ['issues'],
  'nightly-examples.yml#examples': ['issues'],
  'nightly-faults.yml#faults': ['issues'],
  'nightly-mutation-retry.yml#retry': ['actions'],
  'nightly-mutation.yml#report': ['issues'],
  'nightly-properties.yml#report': ['issues'],
  'nightly-recorded-payloads.yml#rerecord': ['contents', 'pull-requests'],
  'nightly-recorded-payloads.yml#report-failure': ['issues'],
  'nightly-schemathesis.yml#report': ['issues'],
  'nightly-sde.yml#report': ['issues'],
  'nightly-spec-drift.yml#check-spec-drift': ['issues'],
  'nightly-spec-drift.yml#report-check-failure': ['issues'],
  'post-publish-canary.yml#report': ['issues'],
  'release-please.yml#release-please': ['contents', 'pull-requests'],
  'release-please.yml#dispatch-release': ['actions'],
  'release.yml#publish-npm': ['id-token'],
  'release.yml#publish-github': ['packages', 'id-token'],
  'release.yml#deploy-docs': ['contents'],
  'release.yml#sign-and-publish-assets': [
    'contents',
    'id-token',
    'attestations',
  ],
  'release.yml#dispatch-canary': ['actions'],
  'scorecard.yml#analysis': ['security-events', 'id-token'],
  'spec-refresh.yml#refresh': ['contents'],
};

function writeScopes(permissions: Permissions | undefined): string[] {
  if (permissions === undefined) return [];
  if (typeof permissions === 'string') {
    return permissions === 'write-all' ? ['write-all'] : [];
  }
  return Object.entries(permissions)
    .filter(([, level]) => level === 'write')
    .map(([scope]) => scope)
    .sort();
}

describe('workflow token permissions', () => {
  const files = workflowFiles();

  it('finds the workflows', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s declares read-only top-level permissions', (file) => {
    const top = load(file).permissions;
    expect(top).toBeDefined();
    if (typeof top === 'string') {
      expect(top).toBe('read-all');
    } else {
      for (const level of Object.values(top ?? {})) {
        expect(['read', 'none']).toContain(level);
      }
    }
  });

  it('grants job-level write scopes only where WRITE_SCOPES lists them', () => {
    const found: Record<string, string[]> = {};
    for (const file of files) {
      for (const [job, def] of Object.entries(load(file).jobs ?? {})) {
        const writes = writeScopes(def.permissions);
        if (writes.length > 0) found[`${file}#${job}`] = writes;
      }
    }
    const expected = Object.fromEntries(
      Object.entries(WRITE_SCOPES).map(([k, v]) => [k, [...v].sort()]),
    );
    expect(found).toEqual(expected);
  });
});

describe('signed releases', () => {
  const release = load('release.yml');
  const job = release.jobs?.['sign-and-publish-assets'];
  const runs = (job?.steps ?? [])
    .map((step) => (typeof step.run === 'string' ? step.run : ''))
    .join('\n');
  const upload = (job?.steps ?? []).find(
    (step) =>
      typeof step.run === 'string' && /gh release upload/.test(step.run),
  )?.run as string | undefined;

  it('signs the tarball, the SBOM and the docs archive with cosign bundles', () => {
    expect(runs).toMatch(/cosign sign-blob/);
    expect(runs).toMatch(
      /for artifact in "\$TARBALL" "\$SBOM" docs\.tar\.gz; do\s+cosign sign-blob/,
    );
    // The uploaded `.sigstore.json` files exist only because of this flag.
    expect(runs).toMatch(
      /cosign sign-blob[^\n]*\\\s+--bundle "\$\{artifact\}\.sigstore\.json"/,
    );
  });

  it('attests build provenance for the same three assets', () => {
    const attest = (job?.steps ?? []).find(
      (step) =>
        typeof step.uses === 'string' &&
        step.uses.startsWith('actions/attest-build-provenance@'),
    );
    expect(attest).toBeDefined();
    const subjects = String(
      (attest?.with as Record<string, unknown> | undefined)?.['subject-path'],
    );
    expect(subjects).toContain('needs.create-assets.outputs.tarball');
    expect(subjects).toContain('needs.create-assets.outputs.sbom');
    expect(subjects).toContain('docs.tar.gz');
  });

  it('uploads a signature for each asset and the provenance file Scorecard looks for', () => {
    expect(upload).toBeDefined();
    for (const asset of [
      '"${TARBALL}.sigstore.json"',
      '"${SBOM}.sigstore.json"',
      'docs.tar.gz.sigstore.json',
      '"${TARBALL%.tgz}.intoto.jsonl"',
      'checksums.txt',
    ]) {
      expect(upload).toContain(asset);
    }
  });
});
