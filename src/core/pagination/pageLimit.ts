/**
 * The most pages any pagination path requests for one call, whatever page
 * count the response reports. `X-Pages` is input from the network, so every
 * entry point checks it against this limit rather than each choosing its own
 * (security model P8, guides/SECURITY-MODEL.md). A reported count above it
 * cannot be walked in full: by default the walk stops at page 1000 with a
 * warning, and with `incompletePages: 'throw'` it rejects after page 1 with
 * an EsiPaginationError whose reason is `page-cap` (DES-08).
 */
export const MAX_PAGES = 1000;

/**
 * What a pagination path does when it cannot prove it holds the whole
 * collection (a count above the page limit, an empty page after the first, a
 * cursor still set at the page limit):
 *
 * - `truncate` (the default in 12.x): return the pages fetched so far and log
 *   a warning that names this option.
 * - `throw`: reject with an `EsiPaginationError` carrying the `reason` and the
 *   `partial` result. The default becomes `throw` in a future major.
 *
 * A page that fails outright rejects in both modes.
 */
export type IncompletePagesMode = 'truncate' | 'throw';

/**
 * The number of pages to request for a reported page count: at least 1, at
 * most MAX_PAGES. An unreadable count (NaN) is one page, as before. In `throw`
 * mode callers reject a count above MAX_PAGES before using this; in
 * `truncate` mode the upper bound is the documented, logged truncation.
 */
export function boundedPageCount(reported: number): number {
  if (!Number.isFinite(reported) || reported < 1) return 1;
  return Math.min(Math.floor(reported), MAX_PAGES);
}
