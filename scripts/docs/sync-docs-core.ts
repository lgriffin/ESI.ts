/**
 * The guide half of the documentation site (DOC-03): which Markdown files
 * become pages under docs-site/guide/, and how their links are rewritten so
 * they work there.
 *
 * `guides/` is the single source. `npm run docs:sync` (scripts/docs/sync-docs.ts)
 * copies README.md, every `guides/*.md` and every `guides/sde/*.md` into
 * docs-site/guide/ at build time; the copies are git-ignored, so the site
 * cannot drift from the guides.
 *
 * A guide's links are written for GitHub: `USAGE.md#8-examples`,
 * `../src/sde/README.md`, `lean/figures/x.svg`. On the site a link to another
 * published guide becomes a link to its page, a local image is copied beside
 * the page, and anything else in the repository becomes a GitHub URL.
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */
import * as path from 'node:path';

export const REPOSITORY = 'lgriffin/ESI.ts';
export const BRANCH = 'master';
export const GITHUB = `https://github.com/${REPOSITORY}`;

/** Where the site copies the images a guide shows, under docs-site/guide/. */
export const ASSET_DIR = 'assets';

/**
 * The sidebar sections, in order, and the files each holds. A guide that is
 * not listed is still published, under the last section, so a new guide
 * reaches the site without an edit here.
 */
export const GUIDE_SECTIONS: ReadonlyArray<{
  text: string;
  sources: readonly string[];
}> = [
  {
    text: 'Using ESI.ts',
    sources: [
      'README.md',
      'guides/USAGE.md',
      'guides/AUTHENTICATION.md',
      'guides/MULTI-CHARACTER.md',
      'guides/PAGINATION.md',
      'guides/ERRORS.md',
      'guides/RUNTIME-VALIDATION.md',
      'guides/LOGGING.md',
    ],
  },
  {
    text: 'Static Data Export',
    sources: [
      'guides/SDE.md',
      'guides/sde/REFERENCE.md',
      'guides/sde/USAGE.md',
      'guides/sde/ARCHITECTURE.md',
      'guides/sde/DEVELOPER_GUIDE.md',
      'guides/sde/API_CONTRACTS.md',
      'guides/sde/TESTING.md',
    ],
  },
  {
    text: 'Compatibility and security',
    sources: ['guides/SEMVER.md', 'guides/SECURITY.md', 'guides/RELEASE.md'],
  },
  {
    text: 'How it is built',
    sources: [
      'guides/CHARTER.md',
      'guides/ROADMAP.md',
      'guides/ARCHITECTURE.md',
      'guides/DESIGN-RULES.md',
      'guides/TESTING.md',
      'guides/QUALITY-GATES.md',
      'guides/LEAN-DECISIONS.md',
      'guides/AUDIT.md',
      'guides/DOCUMENTATION.md',
      'guides/OKF.md',
      'guides/BEADS.md',
    ],
  },
];

export interface GuidePage {
  /** Repository path of the source, e.g. `guides/USAGE.md`. */
  source: string;
  /** File name under docs-site/guide/ without `.md`; README.md is `index`. */
  slug: string;
  /** Sidebar section. */
  section: string;
}

/**
 * `README.md` is the guide index; `guides/MULTI-CHARACTER.md` is
 * `multi-character`; a guide in a subfolder carries it as a prefix, so
 * `guides/sde/USAGE.md` is `sde-usage` and cannot collide with `guides/USAGE.md`.
 */
export function slugFor(source: string): string {
  if (source === 'README.md') return 'index';
  const relative = source.startsWith('guides/') ? source.slice(7) : source;
  return relative.replace(/\.md$/, '').replace(/\//g, '-').toLowerCase();
}

/**
 * The pages to publish from the given source files (README.md and the
 * `guides/*.md` files, as repository paths): listed files in their section's
 * order, then any others, sorted, in the last section.
 */
export function planGuides(sources: readonly string[]): GuidePage[] {
  const available = new Set(sources);
  const pages: GuidePage[] = [];
  const placed = new Set<string>();
  for (const section of GUIDE_SECTIONS) {
    for (const source of section.sources) {
      if (!available.has(source)) continue;
      pages.push({ source, slug: slugFor(source), section: section.text });
      placed.add(source);
    }
  }
  const last = GUIDE_SECTIONS[GUIDE_SECTIONS.length - 1]!.text;
  for (const source of [...sources].sort()) {
    if (placed.has(source)) continue;
    pages.push({ source, slug: slugFor(source), section: last });
  }
  return pages;
}

/** The text of the first `# ` heading, or the fallback. */
export function titleOf(markdown: string, fallback: string): string {
  const match = /^#\s+(.+?)\s*#*\s*$/m.exec(markdown);
  return match ? match[1]!.replace(/`/g, '') : fallback;
}

const IMAGE_EXTENSIONS = /\.(svg|png|jpe?g|gif|webp)$/i;

export type LinkTarget =
  | { kind: 'unchanged' }
  | { kind: 'page'; href: string }
  | { kind: 'asset'; href: string; file: string }
  | { kind: 'github'; href: string; file: string };

/**
 * Where a link in `source` should point on the site.
 *
 * @param pages repository path of every published page, mapped to its slug.
 */
export function resolveLink(
  href: string,
  source: string,
  pages: ReadonlyMap<string, string>,
  isImage: boolean,
): LinkTarget {
  // Absolute URLs, mailto:, in-page anchors and site-absolute paths stay.
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || /^[#/]/.test(href) || !href) {
    return { kind: 'unchanged' };
  }
  const hashAt = href.indexOf('#');
  const target = hashAt === -1 ? href : href.slice(0, hashAt);
  const anchor = hashAt === -1 ? '' : href.slice(hashAt);
  const resolved = path.posix.normalize(
    path.posix.join(path.posix.dirname(source), target),
  );
  if (resolved.startsWith('..')) return { kind: 'unchanged' };

  const slug = pages.get(resolved);
  if (slug !== undefined)
    return { kind: 'page', href: `./${slug}.md${anchor}` };

  if (isImage && IMAGE_EXTENSIONS.test(resolved)) {
    return {
      kind: 'asset',
      href: `./${ASSET_DIR}/${resolved}`,
      file: resolved,
    };
  }
  const isDirectory = target.endsWith('/') || resolved === '.';
  const repoPath = resolved === '.' ? '' : resolved.replace(/\/$/, '');
  return {
    kind: 'github',
    href: `${GITHUB}/${isDirectory ? 'tree' : 'blob'}/${BRANCH}/${repoPath}${anchor}`,
    file: repoPath,
  };
}

const CODE_SPAN = /(`+)[\s\S]*?\1/g;

/**
 * VitePress interpolates `{{ }}` inside inline code, so a span that holds one
 * (`${{ secrets.X }}` in a workflow guide) becomes a `v-pre` element.
 */
function codeForVue(span: string): string {
  if (!span.includes('{{')) return span;
  const inner = span
    .replace(/^(`+) ?([\s\S]*?) ?\1$/, '$2')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<code v-pre>${inner}</code>`;
}

/** Calls `rewrite` on each run of `line` that is outside an inline code span. */
function outsideCode(line: string, rewrite: (text: string) => string): string {
  let out = '';
  let from = 0;
  for (const span of line.matchAll(CODE_SPAN)) {
    out += rewrite(line.slice(from, span.index)) + codeForVue(span[0]);
    from = span.index + span[0].length;
  }
  return out + rewrite(line.slice(from));
}

/** The [start, end) ranges of the inline code spans in `line`. */
function codeSpans(line: string): Array<[number, number]> {
  return [...line.matchAll(CODE_SPAN)].map((m) => [
    m.index,
    m.index + m[0].length,
  ]);
}

const FENCE = /^\s*(`{3,}|~{3,})/;
// The label may hold one level of brackets, as a badge's `[![alt](img)](href)` does.
const INLINE_LINK =
  /(!?)\[((?:[^[\]]|\[[^\]]*\])*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g;
const REFERENCE_LINK = /^(\s*\[[^\]]+\]:\s*)(\S+)(.*)$/;

/**
 * Characters that VitePress reads as Vue template syntax when they appear in
 * prose. A guide is written for GitHub, where `{{` and a bare `<name>` are
 * text, so outside code they are escaped.
 */
const HTML_TAGS = new Set(
  'a b br code details div em i img kbd p pre span strong sub summary sup table tbody td th thead tr'.split(
    ' ',
  ),
);

function escapeForVue(text: string): string {
  return text
    .replace(/\{\{/g, '&#123;&#123;')
    .replace(
      /<(\/?)([A-Za-z][\w-]*)(:?)/g,
      (all, slash: string, name: string, colon: string) =>
        colon || HTML_TAGS.has(name.toLowerCase())
          ? all
          : `&lt;${slash}${name}`,
    );
}

export interface RewriteResult {
  markdown: string;
  /** Repository paths of the images the page shows, to copy beside it. */
  assets: string[];
  /** Repository paths the page now links to on GitHub, for a link check. */
  githubFiles: string[];
}

/**
 * Rewrites every link outside code in a page that came from `source` (see
 * resolveLink), and escapes prose the Vue template compiler would misread.
 */
export function rewriteGuide(
  markdown: string,
  source: string,
  pages: ReadonlyMap<string, string>,
): RewriteResult {
  const assets = new Set<string>();
  const githubFiles = new Set<string>();
  const apply = (href: string, isImage: boolean): string => {
    const target = resolveLink(href, source, pages, isImage);
    if (target.kind === 'unchanged') return href;
    if (target.kind === 'asset') assets.add(target.file);
    if (target.kind === 'github') githubFiles.add(target.file);
    return target.href;
  };

  const rewriteLinks = (line: string): string => {
    const spans = codeSpans(line);
    return line.replace(
      INLINE_LINK,
      (
        all: string,
        bang: string,
        label: string,
        href: string,
        title: string,
        at: number,
      ) =>
        spans.some(([start, end]) => at >= start && at < end)
          ? all
          : `${bang}[${rewriteLinks(label)}](${apply(href, bang === '!')}${title})`,
    );
  };

  let fence: string | null = null;
  const lines = markdown.split('\n').map((line) => {
    const open = FENCE.exec(line);
    if (fence) {
      if (open && open[1]!.startsWith(fence)) fence = null;
      return line;
    }
    if (open) {
      fence = open[1]!;
      return line;
    }
    const reference = REFERENCE_LINK.exec(line);
    if (reference) {
      return `${reference[1]}${apply(reference[2]!, false)}${reference[3]}`;
    }
    return outsideCode(rewriteLinks(line), escapeForVue);
  });
  return {
    markdown: lines.join('\n'),
    assets: [...assets].sort(),
    githubFiles: [...githubFiles].sort(),
  };
}

/** The file written to docs-site/guide/<slug>.md for one page. */
export function renderGuidePage(
  page: GuidePage,
  markdown: string,
  pages: ReadonlyMap<string, string>,
): RewriteResult {
  const rewritten = rewriteGuide(markdown, page.source, pages);
  const title = titleOf(markdown, page.slug);
  const header = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `sourceFile: ${JSON.stringify(page.source)}`,
    '---',
    '',
    `<!-- Generated by scripts/docs/sync-docs.ts from ${page.source}. Edit that file, not this one. -->`,
    '',
  ].join('\n');
  return { ...rewritten, markdown: header + rewritten.markdown };
}

export interface SidebarItem {
  text: string;
  link: string;
}
export interface SidebarGroup {
  text: string;
  collapsed?: boolean;
  items: SidebarItem[];
}

/** The `/guide/` sidebar: one group per section, pages in plan order. */
export function guideSidebar(
  pages: readonly GuidePage[],
  titles: ReadonlyMap<string, string>,
): SidebarGroup[] {
  const groups: SidebarGroup[] = [];
  for (const page of pages) {
    let group = groups.find((g) => g.text === page.section);
    if (!group) {
      group = { text: page.section, items: [] };
      groups.push(group);
    }
    group.items.push({
      text:
        page.slug === 'index'
          ? 'Overview'
          : (titles.get(page.source) ?? page.slug),
      link: page.slug === 'index' ? '/guide/' : `/guide/${page.slug}`,
    });
  }
  return groups;
}
