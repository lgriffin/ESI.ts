import * as fs from 'fs';
import * as path from 'path';

/**
 * The examples log the way the library asks consumers to: through an
 * ILogger (createConsoleLogger), with the same logger type injected into the
 * client. A bare console call would bypass that, so none is allowed.
 */
describe('examples log through ILogger', () => {
  const dir = path.join(__dirname, '../../../examples');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts'));

  it('finds the examples', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s makes no console call', (file) => {
    const source = fs.readFileSync(path.join(dir, file), 'utf8');
    const lines = source
      .split('\n')
      .map((line, i) => `${i + 1}: ${line.trim()}`)
      .filter((line) => /\bconsole\.\w+\s*\(/.test(line));
    expect(lines).toEqual([]);
  });
});
