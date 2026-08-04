import { ApiClient } from '../ApiClient';
import { handleSinglePageRequest } from '../ApiRequestHandler';
import { logInfo } from '../logger/loggerUtil';
import { EsiValidationError } from '../util/error';
import type { EndpointDefinition } from '../endpoints/EndpointDefinition';

export interface PageResult<T = unknown> {
  data: T[];
  page: number;
  totalPages: number;
}

type ResponseSchema = NonNullable<EndpointDefinition['responseSchema']>;

function extractArray<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body !== undefined && body !== null) return [body as T];
  return [];
}

function validatePageBody(
  body: unknown,
  schema: ResponseSchema | undefined,
  url: string,
  validate: boolean,
): unknown {
  if (!schema || !validate) return body;
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new EsiValidationError(url, result.error);
  }
  return result.data;
}

export async function* fetchPages<T = unknown>(
  client: ApiClient,
  endpoint: string,
  method: string,
  requiresAuth: boolean = false,
  body?: unknown,
  templatePath?: string,
  responseSchema?: ResponseSchema,
): AsyncGenerator<PageResult<T>, void, undefined> {
  const validate = client.getValidateResponse();
  const firstResponse = await handleSinglePageRequest(
    client,
    endpoint,
    method,
    body,
    requiresAuth,
    templatePath,
  );

  const firstBody = validatePageBody(
    firstResponse.body,
    responseSchema,
    `${client.getLink()}/${endpoint}`,
    validate,
  );

  const totalPages = parseInt(firstResponse.headers['x-pages'] || '1', 10);

  yield { data: extractArray<T>(firstBody), page: 1, totalPages };

  for (let page = 2; page <= totalPages; page++) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const pagedEndpoint = `${endpoint}${sep}page=${page}`;

    logInfo(`Fetching page ${page}/${totalPages}: ${pagedEndpoint}`);

    const response = await handleSinglePageRequest(
      client,
      pagedEndpoint,
      method,
      body,
      requiresAuth,
      templatePath,
    );

    const pageBody = validatePageBody(
      response.body,
      responseSchema,
      `${client.getLink()}/${pagedEndpoint}`,
      validate,
    );
    const pageData = extractArray<T>(pageBody);
    if (pageData.length === 0) break;

    yield { data: pageData, page, totalPages };
  }
}
