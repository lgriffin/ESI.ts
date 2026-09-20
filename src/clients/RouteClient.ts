import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { routeEndpoints } from '../core/endpoints/routeEndpoints';

export interface RouteOptions {
  preference?: 'Shorter' | 'Safer' | 'LessSecure';
  avoid_systems?: number[];
  connections?: { from: number; to: number }[];
  security_penalty?: number;
}

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
