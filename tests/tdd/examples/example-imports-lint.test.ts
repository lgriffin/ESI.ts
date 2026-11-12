import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';

const exampleImports =
  require('../../../config/eslint/example-imports.rules.cjs') as {
    ENTRY_POINTS: string[];
    rules: Record<string, unknown>;
  };

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    {
      files: ['**/*.ts'],
      languageOptions: { parser: tseslint.parser },
      rules: exampleImports.rules as never,
    },
  ],
});

async function violations(code: string): Promise<number> {
  const [result] = await eslint.lintText(code, {
    filePath: 'examples/fixture.ts',
  });
  return result.messages.filter((m) => m.ruleId === 'no-restricted-imports')
    .length;
}

describe('Examples import only published entry points (#717)', () => {
  it.each([
    ["import { EsiClient } from '../src/EsiClient';"],
    ["import { EsiError } from '../src/core/util/error';"],
    ["import type { MarketGroup } from '../src/sde/domain/types';"],
    ["import { x } from '../src/errors/inner';"],
    ["import { x } from '../src/clientx';"],
    ["export { x } from '../src/core/clock';"],
  ])('rejects %s', async (code) => {
    expect(await violations(code)).toBe(1);
  });

  it.each([
    ...exampleImports.ENTRY_POINTS.map((p) => [`import { x } from '${p}';`]),
    ["import type { MarketGroup } from '../src/sde';"],
    ["import { exampleCharacterId } from './support/character';"],
    ["import * as fs from 'fs';"],
  ])('allows %s', async (code) => {
    expect(await violations(code)).toBe(0);
  });

  it('lists exactly the package.json exports, spelt as ../src paths', () => {
    const pkg = require('../../../package.json') as {
      exports: Record<string, unknown>;
    };
    const fromExports = Object.keys(pkg.exports)
      .filter((key) => key !== './package.json')
      .map((key) => (key === '.' ? '../src' : `../src/${key.slice(2)}`))
      .sort();
    expect([...exampleImports.ENTRY_POINTS].sort()).toEqual(fromExports);
  });
});
