/**
 * What ESI's route endpoint sends back in 0029-route.feature, and where.
 * Step files queue these; they do not build payloads or URLs themselves.
 */
import { RecordedRequest, lastRequest } from './transport';

export const JITA = 30000142;
export const AMARR = 30002187;
export const DISTANT_SYSTEM_ID = 30004759;
export const UNREACHABLE_SYSTEM_ID = 99999999;
export const AVOIDED_SYSTEM_IDS = [30000144, 30000146];

export const routePaths = {
  route: (origin: number, destination: number) =>
    `/route/${origin}/${destination}`,
};

/** The route request the client sent, with its JSON body parsed. */
export function routeRequest(): { request: RecordedRequest; body: unknown } {
  const request = lastRequest();
  return {
    request,
    body: request.body === undefined ? undefined : JSON.parse(request.body),
  };
}

export const routeFixtures = {
  shortestRoute: () => [30000142, 30000144, 30000148, 30002813, 30002187],

  secureRoute: () => [
    30000142, 30000144, 30000146, 30000150, 30000155, 30000160, 30002500,
    30002600, 30002187,
  ],

  insecureRoute: () => [30000142, 30001000, 30002187],

  longRoute: () => [
    30000142, 30000144, 30000148, 30000200, 30000250, 30000300, 30000400,
    30000500, 30001000, 30002000, 30003000, 30004000, 30004500, 30004700,
    30004759,
  ],

  routeAvoidingSystems: () => [
    30000142, 30000149, 30000155, 30000200, 30002187,
  ],
};
