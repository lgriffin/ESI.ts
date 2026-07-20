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
  return match[1];
}

function main(): void {
  const packageVersion = getPackageJsonVersion();
  const constantsVersion = getConstantsVersion();

  if (packageVersion !== constantsVersion) {
    console.error(
      `Version mismatch! package.json: ${packageVersion}, constants.ts: ${constantsVersion}`,
    );
    process.exit(1);
  }
  console.log(`Version consistency check passed: ${packageVersion}`);
}

main();
