/**
 * Human-friendly `npm run help` for ESI.ts.
 *
 * The package has ~100 npm scripts, which is overwhelming as a flat `npm run`
 * listing. This groups them by intent, collapses the two very large families
 * (example:* and bdd:*) into compact summaries, and supports keyword search:
 *
 *   npm run help                 # grouped overview
 *   npm run help -- wallet       # any script whose name or hint mentions "wallet"
 *   npm run help -- example      # every runnable example script
 *   npm run help -- bdd          # every BDD scenario group
 *
 * The one-line hints below are optional: scripts without a hint are still
 * listed and searchable by name, and the example:/bdd: families are always
 * generated from package.json so newly added ones appear automatically.
 */
import { readFileSync } from 'fs';
import * as path from 'path';

/** One line of guidance for the scripts we want to stand out in the overview. */
const DESCS: Record<string, string> = {
  build: 'Compile the library (tsup + type declarations) into dist/',
  typecheck: 'Type-check the source without emitting',
  lint: 'Run ESLint over src/',
  test: 'Run the unit + BDD suite (the default "test")',
  coverage: 'Run unit tests with the coverage report',
  docs: 'Build API docs (TypeDoc) into docs/',
  clean: 'Remove dist/, coverage/, docs/',

  'mock:esi': 'Start a Prism mock ESI server on port 4010',
  'test:integration': 'Mocked integration tests',
  'test:types': 'tsd consumer type-level tests',
  fuzz: 'Property-based fuzz tests (fast-check)',
  benchmark: 'Performance benchmark tests',
  mutation: 'Mutation testing (Stryker)',
  'contract:live': 'Deep contract tests against the live ESI spec',
  knip: 'Detect dead code and unused exports',
  'validate:esi': 'Report hand-written vs generated type drift',
  'generate:types':
    'Regenerate types + TTL/rate-limit/scope maps from the spec',
  'generate:endpoints': 'Generate a new-endpoint client scaffold',
  'token:create': 'Run the EVE SSO OAuth flow and save tokens',
  'token:refresh': 'Refresh the SSO access token',
  'sde:seed': 'Seed the SDE test database',
  'sde:ingest': 'Download CCP static data into local SDE files',
  'health-check': 'One-shot live ESI reachability check',

  // Curated example highlights — the rest are shown by name in the family.
  example: 'Full character profile assembly (auth)',
  'example:status': 'Server status — quickest smoke test (no auth)',
  'example:cursor-pagination': 'Cursor pagination with Freelance Jobs',
  'example:streaming': 'Streaming pagination for large datasets',
  'example:rate-limiting': 'Rate limiter + pagination demonstration',
  'example:token-refresh': 'Automatic token refresh on 401 (auth)',
  'example:write-ops': 'Contacts/fittings/mail/UI write lifecycles (auth)',
};

const FAMILIES = ['example', 'bdd'] as const;

type Scripts = Record<string, string>;

export function loadScripts(cwd = __dirname): Scripts {
  const pkgPath = path.join(cwd, '..', 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
    scripts?: Scripts;
  };
  return pkg.scripts ?? {};
}

const cmd = (name: string): string => `npm run ${name}`;

const pad = (s: string, width: number) =>
  s.length < width ? s + ' '.repeat(width - s.length) : s;

/** A block of "  npm run <name>   <hint>" rows, aligned. */
function rowsAsText(names: string[], hints: boolean): string {
  const width = Math.max(14, ...names.map((n) => cmd(n).length));
  return names
    .map((name) => {
      const hint = hints ? (DESCS[name] ?? '') : '';
      return `  ${pad(cmd(name), width)}${hint ? '  ' + hint : ''}`;
    })
    .join('\n');
}

function keywordAsText(scripts: Scripts, keyword: string): string {
  const kw = keyword.toLowerCase();
  const hits = Object.keys(scripts)
    .sort()
    .filter(
      (name) =>
        name.toLowerCase().includes(kw) ||
        (DESCS[name] ?? '').toLowerCase().includes(kw),
    );

  if (hits.length === 0) {
    return `\nNo scripts match “${keyword}”. Try: npm run help`;
  }

  const header = `\n${hits.length} script${hits.length === 1 ? '' : 's'} match “${keyword}”:`;
  return `${header}\n${rowsAsText(hits, true)}`;
}

/** A big family (example:/bdd:) — list the described ones, fold the rest. */
function familyAsText(scripts: Scripts, family: string): string {
  const prefix = `${family}:`;
  const names = Object.keys(scripts)
    .filter((n) => n.startsWith(prefix))
    .sort();
  if (names.length === 0) return '';

  const described = names.filter((n) => DESCS[n]);
  const bare = names.filter((n) => !DESCS[n]);

  const parts: string[] = [`\n${family} — ${names.length} scripts`];
  if (described.length) parts.push(rowsAsText(described, true));

  if (bare.length) {
    // Compact multi-column listing so a 50-item family stays readable.
    const cells = bare.map(cmd);
    const col = Math.max(...cells.map((c) => c.length)) + 2;
    const perRow = Math.max(1, Math.floor(120 / col));
    const rows: string[] = [];
    for (let i = 0; i < cells.length; i += perRow) {
      rows.push(
        '  ' +
          cells
            .slice(i, i + perRow)
            .map((c) => pad(c, col))
            .join(''),
      );
    }
    parts.push(rows.join('\n'));
    parts.push(`  search any of these: npm run help -- ${family}`);
  }

  return parts.filter(Boolean).join('\n');
}

function overviewAsText(scripts: Scripts): string {
  const described = Object.keys(scripts)
    .sort()
    .filter((n) => DESCS[n] && !/^example(\b|:)/.test(n));
  const blocks: string[] = ['\ntop-level & most-asked scripts'];
  if (described.length) blocks.push(rowsAsText(described, true));

  for (const family of FAMILIES) blocks.push(familyAsText(scripts, family));

  // Everything else that isn't described or already shown as a family.
  const shown = new Set([...described, ...familiesShown(scripts)]);
  const rest = Object.keys(scripts)
    .filter((n) => !shown.has(n))
    .sort();
  const restByFamily = new Map<string, string[]>();
  for (const name of rest) {
    const fam = name.split(':')[0] ?? '(top-level)';
    let list = restByFamily.get(fam);
    if (!list) {
      list = [];
      restByFamily.set(fam, list);
    }
    list.push(name);
  }
  for (const [fam, names] of restByFamily) {
    blocks.push(`\n${fam} (${names.length})`, rowsAsText(names, false));
  }

  blocks.push(
    '\ntip: search them all with  npm run help -- <keyword>   (e.g. npm run help -- wallet)',
  );
  return blocks.filter(Boolean).join('\n');
}

function familiesShown(scripts: Scripts): string[] {
  return FAMILIES.flatMap((f) =>
    Object.keys(scripts).filter((n) => n === f || n.startsWith(`${f}:`)),
  );
}

/** Build the full help text for a set of scripts (pure — used by main and tests). */
export function renderHelp(scripts: Scripts, keyword?: string): string {
  const header = 'ESI.ts — npm commands';
  const key = keyword?.trim() ?? '';
  if (key) {
    return `${header}\n${keywordAsText(scripts, key)}`.trimStart();
  }
  return `${header}\n${overviewAsText(scripts)}`;
}

/** Render help for the current repo's npm scripts against the given keyword. */
export function renderRepoHelp(keyword?: string): string {
  return renderHelp(loadScripts(__dirname), keyword);
}

function main(): void {
  const keyword = process.argv.slice(2).find((a) => !a.startsWith('-'));
  console.log(renderRepoHelp(keyword));
}

// Run as a script (node scripts/npm-help.ts), but not when imported by tests.
if (typeof require !== 'undefined' && require.main === module) {
  main();
}
