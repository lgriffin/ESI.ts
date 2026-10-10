/**
 * The most pages any pagination path requests for one call, whatever page
 * count the response reports. `X-Pages` is input from the network, so every
 * entry point bounds it here rather than each choosing its own cap (security
 * model P8, guides/SECURITY-MODEL.md).
 */
export const MAX_PAGES = 1000;

/**
 * The number of pages to request for a reported page count: at least 1, at
 * most MAX_PAGES. An unreadable count (NaN) is one page, as before.
 */
export function boundedPageCount(reported: number): number {
  if (!Number.isFinite(reported) || reported < 1) return 1;
  return Math.min(Math.floor(reported), MAX_PAGES);
}
