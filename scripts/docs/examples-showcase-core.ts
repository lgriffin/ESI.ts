/**
 * The examples showcase on the documentation site (DOC-03): one page per
 * runnable program in examples/, generated from the program itself.
 *
 * Each example opens with a header comment: a title line
 * (`ESI.ts Example: Market Prices`), a description, a `Usage:` line and an
 * `@nightly <tier>` tag (scripts/docs/examples-core.ts). `npm run docs:sync`
 * (scripts/docs/sync-docs.ts) turns that header and the source into
 * docs-site/examples/<name>.md, and writes an index grouped by category. The
 * pages are git-ignored, so the showcase is always the code that
 * `npm run typecheck:examples` checks.
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */
import { ExampleTier, tierOf } from './examples-core';
import { BRANCH, GITHUB, SidebarGroup } from './sync-docs-core';

/**
 * The package sub-path a reader imports for each `../src/...` path the
 * examples use. The page shows the consumer's import, not the repository's.
 */
export const IMPORT_MAP: Readonly<Record<string, string>> = {
  '../src': '@lgriffin/esi.ts',
  '../src/EsiClient': '@lgriffin/esi.ts',
  '../src/client': '@lgriffin/esi.ts/client',
  '../src/core/util/error': '@lgriffin/esi.ts/errors',
  '../src/sde': '@lgriffin/esi.ts/sde',
  '../src/sde/types': '@lgriffin/esi.ts/sde',
};

/** The showcase's sections, in page order. */
export const CATEGORIES = [
  'Client features',
  'Tokens and characters',
  'Public data',
  'Character and corporation data',
  'Static Data Export (SDE)',
] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * Examples whose point is a feature of the client rather than an ESI domain.
 * Every other example is placed by its `@nightly` tier.
 */
export const FEATURE_EXAMPLES: Readonly<Record<string, Category>> = {
  'rate-limiting.ts': 'Client features',
  'streaming-pagination.ts': 'Client features',
  'cursor-pagination.ts': 'Client features',
  'retry-timeout-metadata.ts': 'Client features',
  'public-vs-authenticated.ts': 'Client features',
  'universe-post-helpers.ts': 'Client features',
  'write-operations.ts': 'Client features',
  'token-manager.ts': 'Tokens and characters',
  'token-refresh.ts': 'Tokens and characters',
  'multi-character.ts': 'Tokens and characters',
};

export function categoryOf(file: string, tier: ExampleTier): Category {
  const featured = FEATURE_EXAMPLES[file];
  if (featured) return featured;
  switch (tier) {
    case 'public':
    case 'mixed':
      return 'Public data';
    case 'auth':
      return 'Character and corporation data';
    case 'sde':
      return 'Static Data Export (SDE)';
  }
}

/** What a reader needs to run an example, by tier. */
export const TIER_BADGES: Readonly<
  Record<ExampleTier, { type: 'tip' | 'info' | 'warning'; text: string }>
> = {
  public: { type: 'tip', text: 'No token needed' },
  mixed: { type: 'info', text: 'Token optional' },
  auth: { type: 'warning', text: 'Needs an access token' },
  sde: { type: 'warning', text: 'Needs local SDE data' },
};

export interface ExampleDoc {
  /** File name under examples/, e.g. `market-prices.ts`. */
  file: string;
  slug: string;
  title: string;
  /** The description paragraphs from the header, as Markdown. */
  description: string;
  /** The first sentence of the description, for the index table. */
  summary: string;
  /** The `Setup:` line from the header, if any. */
  setup?: string;
  tier: ExampleTier;
  category: Category;
  /** The command that runs it: its npm script, or ts-node on the file. */
  command: string;
  /** `client.method` calls the example makes, in first-use order. */
  calls: string[];
  /** The source without its header, imports rewritten for a consumer. */
  code: string;
}

/** The header comment's lines, without the comment markers. */
function headerLines(source: string): { lines: string[]; end: number } {
  const match = /^\s*\/\*\*([\s\S]*?)\*\//.exec(source);
  if (!match) return { lines: [], end: 0 };
  const lines = match[1]!
    .split('\n')
    .map((line) => line.replace(/^\s*\* ?/, '').trimEnd());
  return { lines, end: match[0].length };
}

/** Escapes what Vue or a Markdown table would misread in header prose. */
function prose(text: string): string {
  return text.replace(/</g, '&lt;').replace(/\{\{/g, '&#123;&#123;');
}

/**
 * Rewrites `from '../src/...'` to the package sub-path a consumer imports.
 * Throws on a path IMPORT_MAP does not know, so a new deep import is mapped
 * on purpose rather than shown as an internal path.
 */
export function rewriteImports(code: string, file: string): string {
  return code.replace(/from '(\.\.\/src[^']*)'/g, (_all, from: string) => {
    const to = IMPORT_MAP[from];
    if (!to) {
      throw new Error(
        `examples/${file} imports '${from}', which scripts/docs/examples-showcase-core.ts IMPORT_MAP does not map to a package sub-path. Add it there, or import from a path the package exports.`,
      );
    }
    return `from '${to}'`;
  });
}

const CALL_PREFIX =
  /^(get|post|put|delete|stream|fetchAll|iterate|search|create|update|add|remove|list)/;

/** The `<client>.<method>(` calls in `code` whose client is in `clients`. */
export function callsIn(code: string, clients: ReadonlySet<string>): string[] {
  const calls: string[] = [];
  for (const [, client, method] of code.matchAll(/\.(\w+)\.(\w+)\(/g)) {
    if (!clients.has(client!) || !CALL_PREFIX.test(method!)) continue;
    const call = `${client}.${method}`;
    if (!calls.includes(call)) calls.push(call);
  }
  return calls;
}

/** The npm script whose command runs `examples/<file>`, if there is one. */
export function scriptFor(
  file: string,
  scripts: Readonly<Record<string, string>>,
): string | undefined {
  const target = new RegExp(
    `(^|\\s)examples/${file.replace('.', '\\.')}(\\s|$)`,
  );
  return Object.keys(scripts)
    .filter((name) => target.test(scripts[name]!))
    .sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
}

/** Links `guides/X.md` mentions in header prose to the site's guide pages. */
function linkGuides(
  text: string,
  guideSlugs: ReadonlyMap<string, string>,
): string {
  return text.replace(/\bguides\/[A-Z][A-Z-]*\.md\b/g, (source) => {
    const slug = guideSlugs.get(source);
    return slug ? `[${source}](../guide/${slug}.md)` : source;
  });
}

/**
 * A paragraph's lead-in, before any list it introduces: the lines up to one
 * ending in a colon (which becomes a full stop) or a line starting a list.
 */
function leadOf(paragraph: string): string {
  const lead: string[] = [];
  for (const line of paragraph.split('\n')) {
    if (/^\s*[-*]\s/.test(line)) break;
    if (/:\s*$/.test(line)) {
      lead.push(line.replace(/:\s*$/, '.'));
      break;
    }
    lead.push(line);
  }
  return lead.join('\n');
}

export function parseExample(
  file: string,
  source: string,
  scripts: Readonly<Record<string, string>>,
  clients: ReadonlySet<string>,
  guideSlugs: ReadonlyMap<string, string> = new Map(),
): ExampleDoc {
  const tier = tierOf(source);
  if (!tier) {
    throw new Error(
      `examples/${file} has no @nightly tag; see scripts/docs/examples-core.ts`,
    );
  }
  const { lines, end } = headerLines(source);
  const slug = file.replace(/\.ts$/, '');
  let title = slug;
  let setup: string | undefined;
  const body: string[] = [];
  let seenTitle = false;
  for (const line of lines) {
    const titled = /^ESI\.ts Example:\s*(.+)$/.exec(line);
    if (!seenTitle && titled) {
      title = titled[1]!;
      seenTitle = true;
      continue;
    }
    if (!seenTitle && line.trim()) {
      title = line.trim();
      seenTitle = true;
      continue;
    }
    if (/^@\w+/.test(line) || /^Usage:/.test(line)) continue;
    const setupLine = /^Setup:\s*(.+)$/.exec(line);
    if (setupLine) {
      setup = setupLine[1]!;
      continue;
    }
    body.push(line);
  }
  const description = linkGuides(
    prose(
      body
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim(),
    ),
    guideSlugs,
  );
  const firstParagraph = leadOf(description.split(/\n\s*\n/)[0] ?? '');
  const summary = (
    /^[\s\S]*?[.!?](?=\s|$)/.exec(firstParagraph)?.[0] ?? firstParagraph
  )
    .replace(/\s+/g, ' ')
    .trim();
  const code = rewriteImports(source.slice(end).replace(/^\s+/, ''), file);
  const script = scriptFor(file, scripts);
  const doc: ExampleDoc = {
    file,
    slug,
    title,
    description,
    summary,
    tier,
    category: categoryOf(file, tier),
    command: script ? `npm run ${script}` : `npx ts-node examples/${file}`,
    calls: callsIn(code, clients),
    code,
  };
  if (setup) doc.setup = setup;
  return doc;
}

const sourceUrl = (file: string) => `${GITHUB}/blob/${BRANCH}/examples/${file}`;

/** docs-site/examples/<slug>.md for one example. */
export function renderExamplePage(doc: ExampleDoc): string {
  const badge = TIER_BADGES[doc.tier];
  const nightly =
    doc.tier === 'public' || doc.tier === 'mixed'
      ? ' <Badge type="tip" text="Runs nightly against live ESI" />'
      : '';
  const run = [
    'git clone https://github.com/lgriffin/ESI.ts.git && cd ESI.ts',
    'npm ci',
    ...(doc.setup ? [doc.setup] : []),
    doc.command,
  ];
  const lines = [
    '---',
    `title: ${JSON.stringify(doc.title)}`,
    `description: ${JSON.stringify(doc.summary)}`,
    `sourceFile: ${JSON.stringify(`examples/${doc.file}`)}`,
    '---',
    '',
    `<!-- Generated by scripts/docs/sync-docs.ts from examples/${doc.file}. Edit that file, not this one. -->`,
    '',
    `# ${doc.title}`,
    '',
    `<Badge type="${badge.type}" text="${badge.text}" />${nightly}`,
    '',
    doc.description,
    '',
  ];
  if (doc.calls.length > 0) {
    lines.push(
      `**Calls:** ${doc.calls.map((c) => `\`${c}\``).join(' · ')}`,
      '',
    );
  }
  lines.push(
    '## Run it',
    '',
    '```bash',
    ...run,
    '```',
    '',
    `[\`examples/${doc.file}\` on GitHub](${sourceUrl(doc.file)}). The imports below are written as a consumer of the package writes them; the file in the repository imports from \`../src\`.`,
    '',
    '## Source',
    '',
    '```ts',
    doc.code.trimEnd(),
    '```',
    '',
  );
  return lines.join('\n');
}

// Backslashes first, so a summary ending in `\` cannot escape the pipe that
// closes its cell.
const cell = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');

/** docs-site/examples/index.md: every example, grouped by category. */
export function renderExamplesIndex(docs: readonly ExampleDoc[]): string {
  const lines = [
    '---',
    'title: Examples',
    '---',
    '',
    '<!-- Generated by scripts/docs/sync-docs.ts from examples/*.ts. -->',
    '',
    '# Examples',
    '',
    `${docs.length} runnable programs from [\`examples/\`](${GITHUB}/tree/${BRANCH}/examples), each shown here as it is in the repository. CI type-checks every one of them with \`npm run typecheck:examples\`, and the ones that need no token run against live ESI every night; a failure opens an issue. Every page says what the program needs and the command that runs it.`,
    '',
  ];
  for (const category of CATEGORIES) {
    const inCategory = docs.filter((d) => d.category === category);
    if (inCategory.length === 0) continue;
    lines.push(
      `## ${category}`,
      '',
      '| Example | What it shows | Needs |',
      '| --- | --- | --- |',
      ...inCategory.map(
        (d) =>
          `| [${cell(d.title)}](./${d.slug}.md) | ${cell(d.summary)} | ${TIER_BADGES[d.tier].text} |`,
      ),
      '',
    );
  }
  return lines.join('\n');
}

/** The `/examples/` sidebar: the index, then one group per category. */
export function examplesSidebar(docs: readonly ExampleDoc[]): SidebarGroup[] {
  const groups: SidebarGroup[] = [
    { text: 'Examples', items: [{ text: 'All examples', link: '/examples/' }] },
  ];
  for (const category of CATEGORIES) {
    const items = docs
      .filter((d) => d.category === category)
      .map((d) => ({ text: d.title, link: `/examples/${d.slug}` }));
    if (items.length > 0)
      groups.push({ text: category, collapsed: false, items });
  }
  return groups;
}
