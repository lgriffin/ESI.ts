/**
 * GitHub's heading anchors: lower case, HTML tags and punctuation dropped,
 * each whitespace character to a hyphen. The docs site configures VitePress
 * with this function (docs-site/.vitepress/config.ts), so a guide's
 * `USAGE.md#8-examples` link lands on the same heading on GitHub and on the
 * site, and `tests/tdd/scripts/sync-docs.test.ts` checks guide anchors with it
 * (CHARTER DOC-01). Dependency-free so the VitePress config can import it.
 */
export function githubSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}
