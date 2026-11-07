/**
 * Interceptors for 0072-interceptors.feature, added to the scenario's seam
 * client through EsiClient's own addRequestInterceptor and
 * addResponseInterceptor, with each remover kept under a name the scenario
 * uses to remove it again.
 */
import type {
  RequestInterceptor,
  ResponseInterceptor,
} from '../../../src/core/middleware/Middleware';
import type { World } from './world';

function removers(world: World): Map<string, () => void> {
  world.values.interceptorRemovers ??= new Map<string, () => void>();
  return world.values.interceptorRemovers as Map<string, () => void>;
}

export function addRequestInterceptor(
  world: World,
  name: string,
  fn: RequestInterceptor,
): void {
  removers(world).set(name, world.client.addRequestInterceptor(fn));
}

export function addResponseInterceptor(
  world: World,
  name: string,
  fn: ResponseInterceptor,
): void {
  removers(world).set(name, world.client.addResponseInterceptor(fn));
}

export function removeInterceptor(world: World, name: string): void {
  const remove = removers(world).get(name);
  if (!remove) throw new Error(`No interceptor named ${name} was added`);
  remove();
}

/** A request interceptor that sets one header. */
export const settingHeader =
  (header: string, value: string): RequestInterceptor =>
  (context) => ({
    ...context,
    headers: { ...context.headers, [header]: value },
  });

/** A response interceptor that sets one field of the JSON body. */
export const settingField =
  (field: string, value: unknown): ResponseInterceptor =>
  (context) => ({
    ...context,
    body: { ...(context.body as Record<string, unknown>), [field]: value },
  });
