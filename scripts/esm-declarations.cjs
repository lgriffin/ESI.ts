/**
 * node scripts/esm-declarations.cjs [packageDir]
 *
 * Writes the ES module declarations (`.d.mts`) that the `import` condition of
 * each `package.json` `exports` entry names (esi-23g.29): each entry, and
 * every declaration it reaches through relative imports, copied from the
 * `.d.ts` file tsc wrote beside it. Runs as the last step of `npm run build`,
 * after `tsc --emitDeclarationOnly`.
 *
 * Why a copy: the package is `"type": "commonjs"`, so TypeScript reads every
 * `.d.ts` in it as a CommonJS module. The `import` condition loads `.mjs`
 * files, which are ES modules, and a node16/nodenext ES module consumer given
 * `.d.ts` types sees CommonJS interop that the runtime does not have (a
 * default import that type-checks and then fails to load). A `.d.mts` file is
 * an ES module declaration whatever the package type is.
 *
 * Why the specifiers are rewritten: tsc writes relative specifiers as the
 * source spells them, without an extension (`'./core/ApiClient'`). An ES
 * module declaration resolved under node16 or nodenext needs the full path,
 * and it must lead to the ES module copy: `'./core/ApiClient.mjs'` resolves to
 * `./core/ApiClient.d.mts`, and a directory import becomes
 * `'./dir/index.mjs'`. Leaving `./x` in place would not resolve, and `./x.js`
 * would resolve to the CommonJS `.d.ts`, so the ES module graph would drop
 * back into CommonJS one import in. Bare specifiers (`zod`) are left alone;
 * the consumer's resolver picks their `import` condition.
 *
 * Every relative specifier in a reached file must resolve to a declaration
 * file, or the script throws and the build fails: a specifier it cannot map
 * is one the consumer's compiler could not resolve either. A declaration no
 * entry reaches (tsc also emits `dist/config/jest/`) gets no copy.
 *
 * The `sourceMappingURL` comment still names the `.d.ts.map` file. Rewriting
 * a specifier only changes columns on that import line, and the maps point at
 * `src/`, which the package does not ship.
 *
 * CommonJS, so `npm run build` runs it with node and no TypeScript loader.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

/**
 * String literal nodes that name a module in a declaration file: import and
 * export declarations, `import x = require()`, `import('...')` types, and
 * `declare module '...'` augmentations.
 */
function moduleSpecifierNodes(sourceFile) {
  const nodes = [];
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      nodes.push(node.moduleSpecifier);
    } else if (
      ts.isExternalModuleReference(node) &&
      ts.isStringLiteral(node.expression)
    ) {
      nodes.push(node.expression);
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    ) {
      nodes.push(node.argument.literal);
    } else if (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name)) {
      nodes.push(node.name);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return nodes;
}

/** `.`, `..`, `./x` and `../x`; tsc writes `import(".")` for a sibling index. */
function isRelative(specifier) {
  return /^\.\.?(\/|$)/.test(specifier);
}

/**
 * The ES module spelling of a relative specifier written in `fromFile`, and
 * the `.d.ts` file it names, or null when no declaration file answers it.
 */
function resolveRelative(specifier, fromFile) {
  const dir = path.dirname(fromFile);
  // A specifier that already names a JavaScript file is mapped from its stem.
  const stem = specifier.replace(/\/$/, '').replace(/\.(c|m)?js$/, '');
  const target = path.resolve(dir, stem);
  if (isFile(`${target}.d.ts`)) {
    return { specifier: `${stem}.mjs`, file: `${target}.d.ts` };
  }
  if (isFile(path.join(target, 'index.d.ts'))) {
    return {
      specifier: `${stem}/index.mjs`,
      file: path.join(target, 'index.d.ts'),
    };
  }
  return null;
}

function isFile(file) {
  return fs.existsSync(file) && fs.statSync(file).isFile();
}

/**
 * The `.d.mts` text for one `.d.ts` file.
 *
 * @param {string} text the `.d.ts` contents
 * @param {string} file the `.d.ts` path, used to resolve relative specifiers
 * @returns {{ text: string, imports: string[], unresolved: string[] }}
 *   `imports` are the `.d.ts` files its relative specifiers name
 */
function toEsmDeclaration(text, file) {
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const edits = [];
  const imports = [];
  const unresolved = [];
  for (const node of moduleSpecifierNodes(sourceFile)) {
    if (!isRelative(node.text)) continue;
    const resolved = resolveRelative(node.text, file);
    if (resolved === null) {
      unresolved.push(node.text);
      continue;
    }
    imports.push(resolved.file);
    // Inside the quotes, so the original quote style is kept.
    edits.push({
      start: node.getStart(sourceFile) + 1,
      end: node.getEnd() - 1,
      replacement: resolved.specifier,
    });
  }
  let out = text;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, edit.start) + edit.replacement + out.slice(edit.end);
  }
  return { text: out, imports, unresolved };
}

/**
 * The `.d.mts` files `exports` names under an `import` condition, as
 * absolute paths, from a `package.json` object.
 */
function esmTypeEntries(manifest, packageDir) {
  const entries = [];
  const visit = (value, underImport) => {
    if (typeof value === 'string') {
      if (underImport && value.endsWith('.d.mts')) {
        entries.push(path.resolve(packageDir, value));
      }
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      visit(child, underImport || key === 'import');
    }
  };
  visit(manifest.exports, false);
  return [...new Set(entries)];
}

/**
 * For every `.d.mts` entry the `exports` map of the package in `packageDir`
 * names, write it and every declaration it reaches through relative
 * specifiers, each from its `.d.ts` counterpart. Files no entry reaches get
 * no copy.
 *
 * @param {string} packageDir the directory holding `package.json`
 * @returns {{ entries: number, files: number, rewritten: number }}
 * @throws when an entry has no `.d.ts` counterpart, or a reached declaration
 *   has a relative specifier that names no declaration file
 */
function emitEsmDeclarations(packageDir) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'),
  );
  const entries = esmTypeEntries(manifest, packageDir);
  if (entries.length === 0) {
    throw new Error(
      `package.json in ${packageDir} names no .d.mts file under an "import" condition`,
    );
  }
  const problems = [];
  const outputs = new Map();
  let rewritten = 0;
  const queue = [];
  for (const entry of entries) {
    const source = entry.replace(/\.d\.mts$/, '.d.ts');
    if (isFile(source)) {
      queue.push(source);
    } else {
      problems.push(
        `${path.relative(packageDir, entry)} has no ${path.basename(source)} to copy: run tsc first`,
      );
    }
  }
  while (queue.length > 0) {
    const file = queue.shift();
    const target = file.replace(/\.d\.ts$/, '.d.mts');
    if (outputs.has(target)) continue;
    const result = toEsmDeclaration(fs.readFileSync(file, 'utf8'), file);
    for (const specifier of result.unresolved) {
      problems.push(
        `${path.relative(packageDir, file)}: '${specifier}' resolves to no declaration file`,
      );
    }
    rewritten += result.imports.length;
    outputs.set(target, result.text);
    queue.push(...result.imports);
  }
  if (problems.length > 0) {
    throw new Error(
      `Cannot write ES module declarations:\n  ${problems.join('\n  ')}`,
    );
  }
  for (const [file, text] of outputs) {
    fs.writeFileSync(file, text);
  }
  return { entries: entries.length, files: outputs.size, rewritten };
}

module.exports = { emitEsmDeclarations, esmTypeEntries, toEsmDeclaration };

if (require.main === module) {
  const packageDir = path.resolve(process.argv[2] || '.');
  try {
    const { entries, files, rewritten } = emitEsmDeclarations(packageDir);
    console.log(
      `esm-declarations: ${entries} entries, wrote ${files} .d.mts files (${rewritten} relative specifiers rewritten)`,
    );
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
