/**
 * The transport a `runnable` documentation example runs against. It replaces
 * `globalThis.fetch` before the example loads, so an example exercises the
 * packed client's real pipeline (URL building, headers, response validation)
 * without the network.
 *
 * Each route answers a GET whose path matches with a body the library's
 * schemas accept. A request no route matches fails the example, even when the
 * example catches the error (safe mode, a try/catch): add the route here
 * rather than let an example pass without exercising anything.
 */

const CHARACTER = {
  name: 'CCP Example',
  corporation_id: 98000001,
  bloodline_id: 4,
  race_id: 1,
  gender: 'male',
  birthday: '2003-05-06T00:00:00Z',
};

const ROUTES = [
  {
    path: /^\/status\/?$/,
    body: {
      players: 23456,
      server_version: '2345678',
      start_time: '2026-09-16T11:00:00Z',
      vip: false,
    },
  },
  { path: /^\/characters\/\d+\/?$/, body: CHARACTER },
];

export const requests = [];
export const unrouted = [];

export function installStubFetch() {
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(
      typeof input === 'string' || input instanceof URL ? input : input.url,
    );
    const method = (init.method ?? 'GET').toUpperCase();
    requests.push(`${method} ${url.pathname}`);
    // The client may prefix a version segment (/latest/); routes ignore it.
    const route = url.pathname.replace(/^\/(latest|dev|legacy|v\d+)(?=\/)/, '');
    const match =
      method === 'GET' ? ROUTES.find((r) => r.path.test(route)) : undefined;
    if (!match) {
      unrouted.push(`${method} ${url.pathname}`);
      throw new Error(
        `stub fetch has no route for ${method} ${url.pathname}; add one to tests/doc-examples/stub-fetch.mjs`,
      );
    }
    return new Response(JSON.stringify(match.body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}
