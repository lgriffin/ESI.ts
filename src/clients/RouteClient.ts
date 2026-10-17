import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { routeEndpoints } from '../core/endpoints/routeEndpoints';

/**
 * Options for `RouteClient.getRoute`.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0 with `RouteClient`. The
 * generated route operation takes the request body as the spec types it:
 * `esi.public.route(origin, destination).post(body)`. See
 * guides/LEGACY-REMOVAL.md.
 */
export interface RouteOptions {
  preference?: 'Shorter' | 'Safer' | 'LessSecure' | undefined;
  avoid_systems?: number[] | undefined;
  connections?: { from: number; to: number }[] | undefined;
  security_penalty?: number | undefined;
}

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
export class RouteClient extends BaseEsiClient<typeof routeEndpoints> {
  constructor(client: ApiClient) {
    super(client, routeEndpoints);
  }

  /**
   * Calculates a route between two solar systems, returning the list of system IDs along the path via POST.
   *
   * @param origin - The solar system ID to start the route from
   * @param destination - The solar system ID to route to
   * @param options - Optional routing preferences such as route type, avoided systems, and custom connections
   * @returns An ordered list of solar system IDs representing the route
   */
  async getRoute(
    origin: number,
    destination: number,
    options?: RouteOptions,
  ): Promise<number[]> {
    const body = options ?? {};
    const result = (await this.api.getRoute(origin, destination, body)) as {
      route: number[];
    };
    return result.route;
  }
}
