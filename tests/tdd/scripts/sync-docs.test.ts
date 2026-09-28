/**
 * Self-tests for the documentation site generator (scripts/docs/sync-docs-core.ts,
 * scripts/docs/examples-showcase-core.ts), CHARTER DOC-03.
 *
 * The cases over the real repository come first, because they are the ones a
 * contributor trips: every guide is published, every link a guide makes to a
 * repository file points at a file that exists, and every example parses into
 * a page with a category and a command. VitePress's dead-link check covers
 * the links between pages when `npm run docs:site` builds; the repository
 * links become GitHub URLs, which it cannot check, so this suite does.
 */
import { existsSync, readFileSync, readdirSync } from 'fs';
import * as path from 'path';

import {
  CATEGORIES,
  FEATURE_EXAMPLES,
  IMPORT_MAP,
  callsIn,
  examplesSidebar,
  parseExample,
  renderExamplePage,
  renderExamplesIndex,
  rewriteImports,
  scriptFor,
} from '../../../scripts/docs/examples-showcase-core';
import {
  GUIDE_SECTIONS,
  guideSidebar,
  planGuides,
  renderGuidePage,
  resolveLink,
  rewriteGuide,
  slugFor,
  titleOf,
} from '../../../scripts/docs/sync-docs-core';
import { githubSlug } from '../../../scripts/docs/heading-slug';

const ROOT = path.resolve(__dirname, '../../..');
const read = (repoPath: string) =>
  readFileSync(path.join(ROOT, repoPath), 'utf8');
const guideSources = [
  'README.md',
  ...readdirSync(path.join(ROOT, 'guides'), { withFileTypes: true }).flatMap(
    (entry) => {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        return [`guides/${entry.name}`];
      }
      if (!entry.isDirectory()) return [];
      return readdirSync(path.join(ROOT, 'guides', entry.name))
        .filter((f) => f.endsWith('.md'))
        .map((f) => `guides/${entry.name}/${f}`);
    },
  ),
];
const exampleFiles = readdirSync(path.join(ROOT, 'examples'))
  .filter((f) => f.endsWith('.ts'))
  .sort();
const scripts = (
  JSON.parse(read('package.json')) as { scripts: Record<string, string> }
).scripts;
const clients = new Set(
  [...read('src/EsiClient.ts').matchAll(/^ {2}get (\w+)\(\): \w+ \{/gm)].map(
    (m) => m[1]!,
  ),
);

describe('the site over the real repository', () => {
  const pages = planGuides(guideSources);
  const slugs = new Map(pages.map((p) => [p.source, p.slug]));

  it('publishes README.md as the guide index and every guide once', () => {
    expect(pages[0]).toMatchObject({ source: 'README.md', slug: 'index' });
    expect(pages.map((p) => p.source).sort()).toEqual([...guideSources].sort());
    expect(new Set(pages.map((p) => p.slug)).size).toBe(pages.length);
  });

  it('lists no section source that does not exist', () => {
    const missing = GUIDE_SECTIONS.flatMap((s) => s.sources).filter(
      (source) => !existsSync(path.join(ROOT, source)),
    );
    expect(missing).toEqual([]);
  });

  it.each(pages.map((p) => [p.source, p] as const))(
    '%s links only to repository files that exist',
    (_source, page) => {
      const rendered = renderGuidePage(page, read(page.source), slugs);
      const broken = [...rendered.githubFiles, ...rendered.assets].filter(
        (file) => file && !existsSync(path.join(ROOT, file)),
      );
      expect(broken).toEqual([]);
    },
  );

  it('parses every example into a page with a category and a command', () => {
    expect(exampleFiles.length).toBeGreaterThan(50);
    for (const file of exampleFiles) {
      const doc = parseExample(
        file,
        read(`examples/${file}`),
        scripts,
        clients,
      );
      expect(CATEGORIES).toContain(doc.category);
      expect(doc.title).not.toBe(doc.slug);
      expect(doc.summary.length).toBeGreaterThan(10);
      expect(doc.code).not.toMatch(/from '\.\.\/src/);
    }
  });

  it('names only examples that exist as client-feature examples', () => {
    const missing = Object.keys(FEATURE_EXAMPLES).filter(
      (file) => !exampleFiles.includes(file),
    );
    expect(missing).toEqual([]);
  });

  it('maps every import to a sub-path the package exports', () => {
    const pkg = JSON.parse(read('package.json')) as {
      exports: Record<string, unknown>;
    };
    const exported = Object.keys(pkg.exports).map((key) =>
      key === '.' ? '@lgriffin/esi.ts' : `@lgriffin/esi.ts/${key.slice(2)}`,
    );
    for (const target of Object.values(IMPORT_MAP)) {
      expect(exported).toContain(target);
    }
  });
});

/**
 * CHARTER DOC-01: one canonical file per topic, every other mention a link.
 * A guide that is folded into another must be gone, and every link to a
 * guide, with or without a heading anchor, must land on a file and a heading
 * that exist, so a fold cannot leave a link to the retired copy behind.
 */
const FENCE_LINE = /^\s*(`{3,}|~{3,})/;
/** An inline link's href, `[label](href "title")`. */
const INLINE_LINK = /\[(?:[^[\]]|\[[^\]]*\])*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
/** A reference definition's href, `[label]: href "title"`. */
const REFERENCE_LINK = /^\s{0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/;

/** Lines outside fenced code, with inline code spans blanked. */
function proseLines(markdown: string): string[] {
  let fence: string | null = null;
  const lines: string[] = [];
  for (const line of markdown.split('\n')) {
    const open = FENCE_LINE.exec(line);
    if (open) {
      if (fence === null) fence = open[1]![0]!;
      else if (open[1]![0] === fence) fence = null;
      continue;
    }
    if (fence === null) lines.push(line.replace(/(`+)[\s\S]*?\1/g, ''));
  }
  return lines;
}

/**
 * The anchors a guide's headings get, from the slugifier the docs site is
 * configured with (GitHub's), with GitHub's and markdown-it-anchor's suffix
 * for a repeated heading (`-1`, `-2`), plus explicit `<a id>` targets.
 */
function headingAnchors(markdown: string): Set<string> {
  const anchors = new Set<string>();
  const seen = new Map<string, number>();
  for (const line of proseLines(markdown.replace(/`/g, ''))) {
    for (const m of line.matchAll(/<a\s+(?:id|name)="([^"]+)"/g))
      anchors.add(m[1]!);
    const heading = /^#{1,6}\s+(.*?)(?:\s+#+)?\s*$/.exec(line);
    if (!heading) continue;
    const slug = githubSlug(
      heading[1]!.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1'),
    );
    const count = seen.get(slug) ?? 0;
    seen.set(slug, count + 1);
    anchors.add(count === 0 ? slug : `${slug}-${count}`);
  }
  return anchors;
}

/**
 * Every link in `markdown` (inline or a reference definition) to README.md
 * or a guide that names a file or a heading that does not exist.
 */
function brokenGuideLinks(
  source: string,
  markdown: string,
  guides: ReadonlyMap<string, string>,
): string[] {
  const hrefs = proseLines(markdown).flatMap((line) => {
    const reference = REFERENCE_LINK.exec(line);
    return [
      ...[...line.matchAll(INLINE_LINK)].map((m) => m[1]!),
      ...(reference ? [reference[1]!] : []),
    ];
  });
  return hrefs.filter((href) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('/')) return false;
    const [target, anchor] = href.split('#', 2) as [string, string?];
    const file = target
      ? path.posix.normalize(
          path.posix.join(path.posix.dirname(source), target),
        )
      : source;
    const isGuide =
      file === 'README.md' ||
      (file.startsWith('guides/') && file.endsWith('.md'));
    if (!isGuide) return false;
    const text = file === source ? markdown : guides.get(file);
    if (text === undefined) return true;
    return anchor !== undefined && !headingAnchors(text).has(anchor);
  });
}

describe('one canonical file per topic (CHARTER DOC-01)', () => {
  it('keeps retired copies of a folded guide deleted', () => {
    const retired = ['TESTING.md', 'guides/MUTATION-TESTING.md'].filter(
      (file) => existsSync(path.join(ROOT, file)),
    );
    expect(retired).toEqual([]);
  });

  it('states the canonical test tier table in guides/TESTING.md only', () => {
    const restated = guideSources.filter((source) =>
      proseLines(read(source)).some((line) =>
        /^\|\s*Tier\s*\|.*\|\s*Signal that it can fail\s*\|/.test(line),
      ),
    );
    expect(restated).toEqual(['guides/TESTING.md']);
  });

  const guides = new Map(guideSources.map((source) => [source, read(source)]));

  it.each(guideSources.map((source) => [source] as const))(
    '%s links only to guides and headings that exist',
    (source) => {
      expect(brokenGuideLinks(source, guides.get(source)!, guides)).toEqual([]);
    },
  );

  describe('brokenGuideLinks', () => {
    const fixture = new Map([
      [
        'guides/ROADMAP.md',
        '# Roadmap\n\n## Where 11.0.0 stands\n\n## Notes\n\n## Notes\n\n## The `EsiClient` [guide](USAGE.md)\n',
      ],
    ]);
    const check = (markdown: string) =>
      brokenGuideLinks('guides/TESTING.md', markdown, fixture);

    it('accepts the anchor the site and GitHub give a heading, repeats suffixed', () => {
      expect(
        check(
          '[a](ROADMAP.md#where-1100-stands) [b](ROADMAP.md#notes-1) [c](ROADMAP.md#the-esiclient-guide) [d](ROADMAP.md)',
        ),
      ).toEqual([]);
    });

    it('rejects an anchor no slugifier the site uses produces', () => {
      expect(
        check(
          '[a](ROADMAP.md#where-11-0-0-stands) [b](ROADMAP.md#notes-2) [c](MISSING.md)',
        ),
      ).toEqual([
        'ROADMAP.md#where-11-0-0-stands',
        'ROADMAP.md#notes-2',
        'MISSING.md',
      ]);
    });

    it('checks reference definitions as well as inline links', () => {
      expect(
        check(
          'See [the roadmap][r] and [the plan][p].\n\n[r]: ROADMAP.md#where-1100-stands\n[p]: ROADMAP.md#missing-heading "Plan"\n',
        ),
      ).toEqual(['ROADMAP.md#missing-heading']);
    });

    it('checks an in-page anchor against the page itself', () => {
      expect(check('## Here\n\n[a](#here) [b](#there)')).toEqual(['#there']);
    });
  });
});

describe('planGuides and slugFor', () => {
  it('slugs README.md as the index and a guide by its lower-cased name', () => {
    expect(slugFor('README.md')).toBe('index');
    expect(slugFor('guides/MULTI-CHARACTER.md')).toBe('multi-character');
  });

  it('prefixes a guide in a subfolder with the folder, so guides/sde/USAGE.md does not shadow guides/USAGE.md', () => {
    expect(slugFor('guides/sde/USAGE.md')).toBe('sde-usage');
    expect(slugFor('guides/sde/API_CONTRACTS.md')).toBe('sde-api_contracts');
    expect(guideSources).toEqual(
      expect.arrayContaining(['guides/SDE.md', 'guides/sde/REFERENCE.md']),
    );
  });

  it('keeps section order and puts an unlisted guide in the last section', () => {
    const pages = planGuides([
      'guides/NEW-TOPIC.md',
      'guides/AUTHENTICATION.md',
      'README.md',
      'guides/CHARTER.md',
    ]);
    expect(pages.map((p) => p.source)).toEqual([
      'README.md',
      'guides/AUTHENTICATION.md',
      'guides/CHARTER.md',
      'guides/NEW-TOPIC.md',
    ]);
    expect(pages[3]!.section).toBe(
      GUIDE_SECTIONS[GUIDE_SECTIONS.length - 1]!.text,
    );
  });

  it('reads the title from the first heading, without backticks', () => {
    expect(titleOf('intro\n# The `EsiClient` guide\n## Part', 'x')).toBe(
      'The EsiClient guide',
    );
    expect(titleOf('no heading', 'fallback')).toBe('fallback');
  });
});

describe('resolveLink', () => {
  const pages = new Map([
    ['guides/USAGE.md', 'usage'],
    ['README.md', 'index'],
  ]);
  const from = (href: string, image = false) =>
    resolveLink(href, 'guides/ERRORS.md', pages, image);

  it('points a published guide at its page, keeping the anchor', () => {
    expect(from('USAGE.md#8-examples')).toEqual({
      kind: 'page',
      href: './usage.md#8-examples',
    });
    expect(from('../README.md')).toEqual({ kind: 'page', href: './index.md' });
  });

  it('points another repository file at GitHub, a directory at its tree', () => {
    expect(from('../src/sde/README.md#api')).toEqual({
      kind: 'github',
      href: 'https://github.com/lgriffin/ESI.ts/blob/master/src/sde/README.md#api',
      file: 'src/sde/README.md',
    });
    expect(from('../tests/bdd/')).toMatchObject({
      href: 'https://github.com/lgriffin/ESI.ts/tree/master/tests/bdd',
    });
  });

  it('copies a local image beside the page', () => {
    expect(from('lean/figures/map.svg', true)).toEqual({
      kind: 'asset',
      href: './assets/guides/lean/figures/map.svg',
      file: 'guides/lean/figures/map.svg',
    });
  });

  it('leaves URLs, anchors, site paths and paths outside the repository alone', () => {
    for (const href of [
      'https://esi.evetech.net/',
      'mailto:x@example.com',
      '#retry',
      '/api/',
      '../../elsewhere.md',
    ]) {
      expect(from(href)).toEqual({ kind: 'unchanged' });
    }
  });
});

describe('rewriteGuide', () => {
  const pages = new Map([['guides/USAGE.md', 'usage']]);
  const rewrite = (markdown: string) =>
    rewriteGuide(markdown, 'guides/ERRORS.md', pages).markdown;

  it('rewrites inline and reference links, including a code label', () => {
    expect(rewrite('See [`USAGE`](USAGE.md) and [x][u].\n[u]: USAGE.md')).toBe(
      'See [`USAGE`](./usage.md) and [x][u].\n[u]: ./usage.md',
    );
  });

  it('rewrites the link around a badge image', () => {
    expect(rewrite('[![cov](https://img/x.svg)](USAGE.md)')).toBe(
      '[![cov](https://img/x.svg)](./usage.md)',
    );
  });

  it('leaves fenced code and inline code untouched', () => {
    const fenced = '```md\n[a](USAGE.md) <T>\n```';
    expect(rewrite(fenced)).toBe(fenced);
    expect(rewrite('`[a](USAGE.md)`')).toBe('`[a](USAGE.md)`');
  });

  it('escapes prose Vue would read as a template, and keeps real HTML', () => {
    expect(rewrite('A Map<id, T> and {{ x }} in <details>.')).toBe(
      'A Map&lt;id, T> and &#123;&#123; x }} in <details>.',
    );
    expect(rewrite('An autolink <https://esi.evetech.net>')).toBe(
      'An autolink <https://esi.evetech.net>',
    );
  });

  it('turns inline code holding {{ into a v-pre element', () => {
    expect(rewrite('interpolating `${{ a < b }}` into shell')).toBe(
      'interpolating <code v-pre>${{ a &lt; b }}</code> into shell',
    );
  });

  it('reports the images and repository files the page links to', () => {
    const result = rewriteGuide(
      '![m](lean/m.png) [s](../src/index.ts)',
      'guides/ERRORS.md',
      pages,
    );
    expect(result.assets).toEqual(['guides/lean/m.png']);
    expect(result.githubFiles).toEqual(['src/index.ts']);
  });
});

describe('renderGuidePage and guideSidebar', () => {
  const page = {
    source: 'guides/ERRORS.md',
    slug: 'errors',
    section: 'Using ESI.ts',
  };

  it('adds a title, the source for the edit link, and a do-not-edit note', () => {
    const out = renderGuidePage(page, '# Errors\n\nBody', new Map()).markdown;
    expect(out).toMatch(
      /^---\ntitle: "Errors"\nsourceFile: "guides\/ERRORS.md"\n---\n/,
    );
    expect(out).toContain('Edit that file, not this one.');
    expect(out).toContain('# Errors\n\nBody');
  });

  it('groups pages by section and calls the index Overview', () => {
    const sidebar = guideSidebar(
      [{ source: 'README.md', slug: 'index', section: 'A' }, page],
      new Map([['guides/ERRORS.md', 'Errors']]),
    );
    expect(sidebar).toEqual([
      { text: 'A', items: [{ text: 'Overview', link: '/guide/' }] },
      {
        text: 'Using ESI.ts',
        items: [{ text: 'Errors', link: '/guide/errors' }],
      },
    ]);
  });
});

const SAMPLE = `/**
 * ESI.ts Example: Market Prices
 *
 * Fetches average prices. Then some more.
 * See guides/PAGINATION.md.
 *
 * Handles Map<id, T> safely.
 *
 * Setup: npx ts-node scripts/sde/sde-ingest.ts
 * Usage: npm run example:market
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const client = new EsiClient();
await client.market.getMarketPrices();
await client.market.getMarketPrices();
response.headers.get('etag');
await client.status.getStatus();
`;

describe('parseExample', () => {
  const doc = parseExample(
    'market-prices.ts',
    SAMPLE,
    {
      'example:market': 'ts-node examples/market-prices.ts',
      'example:market-prices-long': 'ts-node examples/market-prices.ts',
    },
    new Set(['market', 'status']),
    new Map([['guides/PAGINATION.md', 'pagination']]),
  );

  it('reads the title, description, summary, setup and tier from the header', () => {
    expect(doc.title).toBe('Market Prices');
    expect(doc.summary).toBe('Fetches average prices.');
    expect(doc.description).toContain(
      'See [guides/PAGINATION.md](../guide/pagination.md).',
    );
    expect(doc.description).toContain('Map&lt;id, T>');
    expect(doc.description).not.toMatch(/Usage:|@nightly|Setup:/);
    expect(doc.setup).toBe('npx ts-node scripts/sde/sde-ingest.ts');
    expect(doc.tier).toBe('public');
    expect(doc.category).toBe('Public data');
  });

  it('runs it with the shortest npm script that names the file', () => {
    expect(doc.command).toBe('npm run example:market');
    expect(
      scriptFor('none.ts', { a: 'ts-node examples/other.ts' }),
    ).toBeUndefined();
  });

  it('lists client calls once each and ignores non-client calls', () => {
    expect(doc.calls).toEqual(['market.getMarketPrices', 'status.getStatus']);
    expect(
      callsIn('x.headers.get(1); x.market.map(2)', new Set(['market'])),
    ).toEqual([]);
  });

  it('does not list a call written inside a string or a comment', () => {
    const code = [
      'const note = `use client.market.getMarketPrices() here`;',
      '// client.status.getStatus()',
      'await client.universe.getTypes();',
    ].join('\n');
    expect(callsIn(code, new Set(['market', 'status', 'universe']))).toEqual([
      'universe.getTypes',
    ]);
  });

  it('shows the code with consumer imports and without the header', () => {
    expect(doc.code).toMatch(
      /^import \{ EsiClient \} from '@lgriffin\/esi.ts';/,
    );
    expect(doc.code).toContain("from '@lgriffin/esi.ts/errors'");
    expect(doc.code).not.toContain('@nightly');
  });

  it('cuts a summary at the colon that introduces a list', () => {
    const listed = parseExample(
      'x.ts',
      '/**\n * ESI.ts Example: X\n *\n * Demonstrates three things:\n * - one\n *\n * @nightly auth\n */\n',
      {},
      new Set(),
    );
    expect(listed.summary).toBe('Demonstrates three things.');
    expect(listed.command).toBe('npx ts-node examples/x.ts');
    expect(listed.category).toBe('Character and corporation data');
  });

  it('places a client-feature example by name before its tier', () => {
    const src = SAMPLE.replace('@nightly public', '@nightly auth');
    expect(parseExample('token-refresh.ts', src, {}, new Set()).category).toBe(
      'Tokens and characters',
    );
  });

  it('fails on an example with no tier', () => {
    expect(() =>
      parseExample(
        'x.ts',
        SAMPLE.replace('@nightly public', ''),
        {},
        new Set(),
      ),
    ).toThrow(/no @nightly tag/);
  });
});

describe('rewriteImports', () => {
  it('fails on a source path that maps to no package sub-path', () => {
    expect(() =>
      rewriteImports("import { x } from '../src/core/internal';", 'x.ts'),
    ).toThrow(/IMPORT_MAP does not map/);
  });
});

describe('rendering the showcase', () => {
  const doc = parseExample(
    'market-prices.ts',
    SAMPLE,
    { 'example:market': 'ts-node examples/market-prices.ts' },
    new Set(['market']),
  );

  it('renders a page with its badges, command, source link and code', () => {
    const page = renderExamplePage(doc);
    expect(page).toContain('title: "Market Prices"');
    expect(page).toContain('sourceFile: "examples/market-prices.ts"');
    expect(page).toContain('<Badge type="tip" text="No token needed" />');
    expect(page).toContain('Runs nightly against live ESI');
    expect(page).toContain(
      'npx ts-node scripts/sde/sde-ingest.ts\nnpm run example:market',
    );
    expect(page).toContain(
      'https://github.com/lgriffin/ESI.ts/blob/master/examples/market-prices.ts',
    );
    expect(page).toContain(
      "```ts\nimport { EsiClient } from '@lgriffin/esi.ts';",
    );
  });

  it('renders an index with the count and one table per non-empty category', () => {
    const index = renderExamplesIndex([doc]);
    expect(index).toContain('1 runnable programs');
    expect(index).toContain('## Public data');
    expect(index).not.toContain('## Client features');
    expect(index).toContain(
      '| [Market Prices](./market-prices.md) | Fetches average prices. | No token needed |',
    );
  });

  it('escapes backslashes and pipes in index table cells', () => {
    const index = renderExamplesIndex([
      { ...doc, summary: 'Splits a | b on C:\\path\\' },
    ]);
    expect(index).toContain('| Splits a \\| b on C:\\\\path\\\\ |');
  });

  it('builds the examples sidebar from the categories in use', () => {
    expect(examplesSidebar([doc])).toEqual([
      {
        text: 'Examples',
        items: [{ text: 'All examples', link: '/examples/' }],
      },
      {
        text: 'Public data',
        collapsed: false,
        items: [{ text: 'Market Prices', link: '/examples/market-prices' }],
      },
    ]);
  });
});
