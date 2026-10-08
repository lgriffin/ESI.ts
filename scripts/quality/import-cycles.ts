/**
 * npm run lint:cycles
 *
 * Fails on any runtime import cycle among the files under src/. See
 * scripts/quality/import-cycles-core.ts for what counts as an edge.
 *
 * Exit codes: 0 no cycles, 1 cycles found, 2 the check itself is broken.
 */
import { readdirSync } from 'fs';
import * as path from 'path';
import { buildGraph, cyclePath, findCycles } from './import-cycles-core';

const REPO_ROOT = path.resolve(__dirname, '../..');

function sourceFiles(dir: string): string[] {
  return readdirSync(path.join(REPO_ROOT, dir), { withFileTypes: true })
    .flatMap((entry) => {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return sourceFiles(rel);
      return entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')
        ? [rel]
        : [];
    })
    .sort();
}

function main(): number {
  const files = sourceFiles('src');
  if (files.length === 0) {
    console.error('No files found under src/: the check compared nothing.');
    return 2;
  }
  const graph = buildGraph(REPO_ROOT, files);
  const edges = [...graph.values()].reduce((n, t) => n + t.length, 0);
  const cycles = findCycles(graph);
  console.log(
    `Import cycles: ${files.length} files, ${edges} runtime imports, ${cycles.length} cycles.`,
  );
  if (cycles.length === 0) return 0;
  const report = cycles
    .map((c) => `  ${cyclePath(graph, c).join(' -> ')}`)
    .join('\n');
  console.error(
    `\n${cycles.length} runtime import cycles in src/. Break each one, usually by moving a shared type into the interface module and importing it with \`import type\`:\n${report}`,
  );
  return 1;
}

process.exit(main());
