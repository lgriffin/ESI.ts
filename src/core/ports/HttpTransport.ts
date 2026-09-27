/**
 * Sends one HTTP request. `fetch` is the default; a proxy agent, a recording
 * transport or a test double implements the same signature. The same shape as
 * the `FetchLike` accepted by `ApiClient.setFetch`.
 */
export type HttpTransport = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;
