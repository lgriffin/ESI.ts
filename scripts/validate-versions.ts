import { readFileSync } from 'fs';
import * as path from 'path';

function getPackageJsonVersion(): string {
  const pkgPath = path.join(__dirname, '..', 'package.json');
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
    '..',
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
 * The docs site's version selector (REL-03). The line carries the
 * `x-release-please-version` marker and the file is in release-please's
 * `extra-files`, so a release bumps it with the other two.
 */
function getDocsSiteVersion(): string {
  const configPath = path.join(
    __dirname,
    '..',
    'docs-site',
    '.vitepress',
    'config.ts',
  );
  const content = readFileSync(configPath, 'utf-8');
  const match = content.match(
    /text:\s*['"]v([^'"]+)['"],?\s*\/\/\s*x-release-please-version/,
  );
  if (!match) {
    console.error(
      "Could not find the version selector (a `text: 'vX.Y.Z'` line marked x-release-please-version) in docs-site/.vitepress/config.ts",
    );
    process.exit(1);
  }
  return match[1]!;
}

function main(): void {
  const packageVersion = getPackageJsonVersion();
  const versions: Record<string, string> = {
    'src/core/constants.ts': getConstantsVersion(),
    'docs-site/.vitepress/config.ts': getDocsSiteVersion(),
  };

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
    `Version consistency check passed: ${packageVersion} in package.json, src/core/constants.ts and docs-site/.vitepress/config.ts`,
  );
}

main();
