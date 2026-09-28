import { existsSync, readFileSync } from 'fs';
import * as path from 'path';

import { formatProblems } from '../docs/doc-metrics-core';
import { checkMetrics } from '../docs/doc-metrics';

const ROOT = path.join(__dirname, '../..');

function getPackageJsonVersion(): string {
  const pkgPath = path.join(__dirname, '../..', 'package.json');
  const content = readFileSync(pkgPath, 'utf-8');
  const pkg = JSON.parse(content) as { version?: string };
  if (!pkg.version) {
    console.error('No "version" field found in package.json');
    process.exit(1);
  }
  return pkg.version;
}

function getConstantsVersion(): string {
  const constantsPath = path.join(
    __dirname,
    '../..',
    'src',
    'core',
    'constants.ts',
  );
  const content = readFileSync(constantsPath, 'utf-8');
  const match = content.match(/PACKAGE_VERSION\s*=\s*['"]([^'"]+)['"]/);
  if (!match) {
    console.error('Could not find PACKAGE_VERSION in constants.ts');
    process.exit(1);
  }
  return match[1]!;
}

/**
 * The docs site's version selector (REL-03). `docs-site/.vitepress/config.ts`
 * builds it from package.json at build time, so the source can only go
 * stale by no longer reading package.json; this fails if it stops.
 */
function checkDocsSiteSource(): string | null {
  const configPath = path.join(ROOT, 'docs-site', '.vitepress', 'config.ts');
  const content = readFileSync(configPath, 'utf-8');
  const readsPackage = /new URL\(\s*['"]\.\.\/\.\.\/package\.json['"]/.test(
    content,
  );
  const showsIt = /text:\s*`v\$\{pkg\.version\}`/.test(content);
  return readsPackage && showsIt
    ? null
    : 'docs-site/.vitepress/config.ts: the version selector must be `v${pkg.version}`, with pkg read from ../../package.json';
}

/**
 * With `--site`, the built site's version selector
 * (docs-site/.vitepress/dist/index.html), so a deploy cannot publish a site
 * built from another version. `npm run docs:site` builds it.
 */
function getBuiltSiteVersion(): string {
  const indexPath = path.join(
    ROOT,
    'docs-site',
    '.vitepress',
    'dist',
    'index.html',
  );
  if (!existsSync(indexPath)) {
    console.error(
      'No built site at docs-site/.vitepress/dist/index.html; run `npm run docs:site` first',
    );
    process.exit(1);
  }
  const match = /<span[^>]*>v(\d+\.\d+\.\d+[^<]*)<\/span>/.exec(
    readFileSync(indexPath, 'utf-8'),
  );
  if (!match) {
    console.error(
      'Could not find the version selector in docs-site/.vitepress/dist/index.html',
    );
    process.exit(1);
  }
  return match[1]!;
}

function main(): void {
  const packageVersion = getPackageJsonVersion();
  const versions: Record<string, string> = {
    'src/core/constants.ts': getConstantsVersion(),
  };
  const site = process.argv.includes('--site');
  if (site) {
    versions['docs-site/.vitepress/dist/index.html'] = getBuiltSiteVersion();
  }
  const sourceProblem = checkDocsSiteSource();
  if (sourceProblem) {
    console.error(sourceProblem);
    process.exit(1);
  }

  // DOC-04: the version banner and every count the docs quote sit between
  // metric markers; a stale one, or a stale etc/doc-metrics.json, fails here.
  const metricProblems = formatProblems(checkMetrics().report);
  if (metricProblems.length > 0) {
    for (const p of metricProblems) console.error(p);
    console.error(
      'Documentation metrics are stale; run `npm run docs:metrics`',
    );
    process.exit(1);
  }

  const stale = Object.entries(versions).filter(
    ([, v]) => v !== packageVersion,
  );
  if (stale.length > 0) {
    console.error(`Version mismatch! package.json: ${packageVersion}`);
    for (const [file, version] of stale) {
      console.error(`  ${file}: ${version}`);
    }
    process.exit(1);
  }
  console.log(
    `Version consistency check passed: ${packageVersion} in package.json and src/core/constants.ts; the docs-site selector reads package.json${site ? ' and the built site shows it' : ''}; the documentation's marked counts and version match etc/doc-metrics.json and the source`,
  );
}

main();
