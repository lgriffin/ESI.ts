/**
 * Generate the documentation site's content from the repository (DOC-03):
 * `npm run docs:sync`.
 *
 *   docs-site/guide/<slug>.md     README.md and every guides/*.md, links
 *                                 rewritten (scripts/docs/sync-docs-core.ts)
 *   docs-site/guide/assets/...    the images those pages show
 *   docs-site/examples/<name>.md  one page per examples/*.ts, and an index
 *                                 (scripts/docs/examples-showcase-core.ts)
 *   docs-site/.vitepress/sidebar.generated.json
 *
 * Everything it writes is git-ignored and rebuilt from scratch on each run,
 * so a page cannot outlive its source. `npm run docs:site` runs this between
 * TypeDoc and the VitePress build.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  ExampleDoc,
  examplesSidebar,
  parseExample,
  renderExamplePage,
  renderExamplesIndex,
} from './examples-showcase-core';
import {
  ASSET_DIR,
  guideSidebar,
  planGuides,
  renderGuidePage,
  titleOf,
} from './sync-docs-core';

const ROOT = path.resolve(__dirname, '../..');
const SITE = path.join(ROOT, 'docs-site');
const GUIDE_OUT = path.join(SITE, 'guide');
const EXAMPLES_OUT = path.join(SITE, 'examples');
const SIDEBAR_OUT = path.join(SITE, '.vitepress', 'sidebar.generated.json');

/** The sidebar for each generated section, keyed by route prefix. */
const sidebar: Record<string, unknown> = {};

const read = (repoPath: string) =>
  fs.readFileSync(path.join(ROOT, repoPath), 'utf8');

function write(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

/** The `EsiClient` getters, which name the clients an example calls. */
function clientNames(): Set<string> {
  const source = read('src/EsiClient.ts');
  return new Set(
    [...source.matchAll(/^ {2}get (\w+)\(\): \w+ \{/gm)].map((m) => m[1]!),
  );
}

function syncGuides(): { slugs: Map<string, string>; count: number } {
  const sources = [
    'README.md',
    ...fs
      .readdirSync(path.join(ROOT, 'guides'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => `guides/${f}`),
  ];
  const pages = planGuides(sources);
  const slugs = new Map(pages.map((p) => [p.source, p.slug]));
  const titles = new Map<string, string>();
  for (const page of pages) {
    const markdown = read(page.source);
    titles.set(page.source, titleOf(markdown, page.slug));
    const rendered = renderGuidePage(page, markdown, slugs);
    write(path.join(GUIDE_OUT, `${page.slug}.md`), rendered.markdown);
    for (const asset of rendered.assets) {
      const to = path.join(GUIDE_OUT, ASSET_DIR, asset);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(path.join(ROOT, asset), to);
    }
  }
  sidebar['/guide/'] = guideSidebar(pages, titles);
  return { slugs, count: pages.length };
}

function syncExamples(guideSlugs: ReadonlyMap<string, string>): number {
  const scripts = (
    JSON.parse(read('package.json')) as { scripts: Record<string, string> }
  ).scripts;
  const clients = clientNames();
  const docs: ExampleDoc[] = fs
    .readdirSync(path.join(ROOT, 'examples'))
    .filter((f) => f.endsWith('.ts'))
    .map((file) =>
      parseExample(
        file,
        read(`examples/${file}`),
        scripts,
        clients,
        guideSlugs,
      ),
    )
    .sort((a, b) => a.title.localeCompare(b.title));
  for (const doc of docs) {
    write(path.join(EXAMPLES_OUT, `${doc.slug}.md`), renderExamplePage(doc));
  }
  write(path.join(EXAMPLES_OUT, 'index.md'), renderExamplesIndex(docs));
  sidebar['/examples/'] = examplesSidebar(docs);
  return docs.length;
}

function main(): void {
  fs.rmSync(GUIDE_OUT, { recursive: true, force: true });
  fs.rmSync(EXAMPLES_OUT, { recursive: true, force: true });
  const guides = syncGuides();
  const examples = syncExamples(guides.slugs);
  write(SIDEBAR_OUT, `${JSON.stringify(sidebar, null, 2)}\n`);
  console.log(
    `docs:sync wrote ${guides.count} guide pages to docs-site/guide/ and ${examples} example pages to docs-site/examples/`,
  );
}

main();
