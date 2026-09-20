import { EndpointDefinition } from './EndpointDefinition';
import { validatePathParam, validateQueryParam } from '../util/validation';

export interface EndpointPathResult {
  path: string;
  body: unknown;
}

export function buildEndpointPath(
  def: EndpointDefinition,
  args: unknown[],
  datasource?: string,
): EndpointPathResult {
  let argIndex = 0;
  let path = def.path;

  if (def.pathParams) {
    for (const param of def.pathParams) {
      const raw = args[argIndex++];
      const validated = validatePathParam(param, raw);
      path = path.replace(`{${param}}`, encodeURIComponent(validated));
    }
  }

  if (def.queryParams) {
    const queryParts: string[] = [];
    for (const [paramName, queryKey] of Object.entries(def.queryParams)) {
      const value = args[argIndex++];
      if (value !== undefined) {
        const validated = validateQueryParam(paramName, value);
        queryParts.push(`${queryKey}=${encodeURIComponent(validated)}`);
      }
    }
    if (queryParts.length > 0) {
      path += (path.includes('?') ? '&' : '?') + queryParts.join('&');
    }
  }

  let body: unknown = undefined;
  if (def.bodyBuilder) {
    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    body = def.bodyBuilder(
      ...(args.slice(argIndex) as Parameters<typeof def.bodyBuilder>),
    );
    /* eslint-enable @typescript-eslint/no-unsafe-argument */
  } else if (def.hasBody) {
    // eslint-disable-next-line security/detect-object-injection
    body = args[argIndex];
  }

  if (datasource) {
    path +=
      (path.includes('?') ? '&' : '?') +
      `datasource=${encodeURIComponent(datasource)}`;
  }

  return { path, body };
}
