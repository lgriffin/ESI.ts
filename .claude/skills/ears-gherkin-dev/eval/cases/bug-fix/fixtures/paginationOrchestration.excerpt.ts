// Excerpt of src/core/requestPipeline/paginationOrchestration.ts (fixture,
// simplified). The follow-up page URL is built from the path without its query.

export async function handleOffsetPagination(
  endpoint: string,
  firstPage: unknown[],
  totalPages: number,
  pageFetch: (paginatedEndpoint: string) => Promise<unknown[]>,
): Promise<unknown[]> {
  if (totalPages <= 1) return firstPage;
  const basePath = endpoint.split('?')[0];
  const rest: unknown[][] = [];
  for (let page = 2; page <= totalPages; page++) {
    rest.push(await pageFetch(`${basePath}?page=${page}`));
  }
  return [...firstPage, ...rest.flat()];
}
