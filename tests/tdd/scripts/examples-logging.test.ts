import * as fs from 'fs';
import * as path from 'path';

/**
 * The examples and the documentation's code blocks log the way the library
 * asks consumers to: through an ILogger (createConsoleLogger), with the same
 * logger type injected into the client. A bare console call would bypass
 * that, so none is allowed.
 */
const ROOT = path.join(__dirname, '../../..');
const CONSOLE_CALL = /\bconsole\.\w+\s*\(/;

/** `line: text` for each line of `source` that calls console. */
function consoleCalls(source: string, offset = 0): string[] {
  return source
    .split('\n')
    .map((line, i) => `${i + 1 + offset}: ${line.trim()}`)
    .filter((line) => CONSOLE_CALL.test(line));
}

describe('examples log through ILogger', () => {
  const dir = path.join(ROOT, 'examples');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts'));

  it('finds the examples', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s makes no console call', (file) => {
    expect(consoleCalls(fs.readFileSync(path.join(dir, file), 'utf8'))).toEqual(
      [],
    );
  });
});

describe('documentation code blocks log through ILogger', () => {
  const docs = (dir: string): string[] =>
    fs
      .readdirSync(path.join(ROOT, dir), { withFileTypes: true })
      .flatMap((e) => {
        const rel = path.join(dir, e.name);
        if (e.isDirectory()) return docs(rel);
        return e.name.endsWith('.md') ? [rel] : [];
      });
  const files = ['README.md', ...docs('guides')];

  it.each(files)('%s has no console call in a ts block', (file) => {
    const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n');
    const found: string[] = [];
    let inTs = false;
    let start = 0;
    let block: string[] = [];
    lines.forEach((line, i) => {
      if (!inTs && /^\s*```(ts|typescript)\b/.test(line)) {
        inTs = true;
        start = i + 1;
        block = [];
      } else if (inTs && /^\s*```\s*$/.test(line)) {
        inTs = false;
        found.push(...consoleCalls(block.join('\n'), start));
      } else if (inTs) {
        block.push(line);
      }
    });
    expect(found).toEqual([]);
  });
});
