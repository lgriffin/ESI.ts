/**
 * npm run release:dedupe-changelog -- --changelog CHANGELOG.md --body body.md
 *
 * Removes the release-notes lines a merge commit repeats (#377): see
 * scripts/release/changelog-dedupe-core.ts. release-please.yml runs it on the
 * open release pull request, over the branch's CHANGELOG.md and the pull
 * request body, which is what release-please turns into the GitHub release.
 *
 * Run from a full clone of the release branch. The merges considered are those
 * since the newest `vX.Y.Z` tag.
 *
 *   --changelog <file>  rewrite the newest release in this changelog
 *   --body <file>       rewrite these release notes (the whole file)
 */
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

import {
  MergeInfo,
  dedupeNewestRelease,
  dropRepeatedEntries,
  mergeTwins,
} from './changelog-dedupe-core';

function git(...args: string[]): string {
  const run = spawnSync('git', args, { encoding: 'utf-8' });
  if (run.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${run.stderr.trim()}`);
  }
  return run.stdout.trim();
}

function arg(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`);
  return at === -1 ? undefined : process.argv[at + 1];
}

function lastTag(): string | undefined {
  const run = spawnSync(
    'git',
    ['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*.[0-9]*.[0-9]*'],
    { encoding: 'utf-8' },
  );
  return run.status === 0 ? run.stdout.trim() : undefined;
}

function main(): void {
  const changelog = arg('changelog');
  const body = arg('body');
  if (!changelog && !body) {
    throw new Error('Pass --changelog <file>, --body <file> or both.');
  }

  const tag = lastTag();
  const merges = git(
    'rev-list',
    '--merges',
    tag ? `${tag}..HEAD` : 'HEAD',
  ).split('\n');
  const info = new Map<string, MergeInfo>();
  for (const sha of merges.filter(Boolean)) {
    const lines = (text: string) => text.split('\n').filter(Boolean);
    info.set(sha, {
      body: lines(git('log', '-1', '--format=%b', sha)),
      branch: lines(git('log', '--format=%H %s', `${sha}^1..${sha}^2`)).map(
        (line) => ({ sha: line.slice(0, 40), subject: line.slice(41) }),
      ),
    });
  }
  const twins = mergeTwins(info);
  console.log(
    `${twins.size} of ${info.size} merge commits since ${tag ?? 'the start'} repeat a commit on their branch`,
  );

  if (changelog) {
    const before = readFileSync(changelog, 'utf-8');
    writeFileSync(changelog, dedupeNewestRelease(before, twins));
  }
  if (body) {
    const before = readFileSync(body, 'utf-8');
    writeFileSync(body, dropRepeatedEntries(before, twins));
  }
}

main();
