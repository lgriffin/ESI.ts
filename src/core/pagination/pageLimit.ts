/**
 * The most pages any pagination path requests for one call, whatever page
 * count the response reports. `X-Pages` is input from the network, so every
 * entry point checks it against this limit rather than each choosing its own
 * (security model P8, guides/SECURITY-MODEL.md). A reported count above it
 * cannot be walked in full, so the walk rejects after page 1 with an
 * EsiPaginationError whose reason is `page-cap` (DES-08).
 */
export const MAX_PAGES = 1000;

/**
 * The number of pages to request for a reported page count: at least 1, at
 * most MAX_PAGES. An unreadable count (NaN) is one page, as before. Callers
 * reject a count above MAX_PAGES before using this, so the upper bound is a
 * backstop rather than a silent truncation.
 */
export function boundedPageCount(reported: number): number {
  if (!Number.isFinite(reported) || reported < 1) return 1;
  return Math.min(Math.floor(reported), MAX_PAGES);
}
