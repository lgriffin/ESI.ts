import { expectType, expectAssignable } from 'tsd';
import type {
  EndpointArgs,
  EndpointDefinition,
  HttpMethod,
} from '../../src/core/endpoints/EndpointDefinition';
import type {
  WithMetadata,
  CreateClientOptions,
} from '../../src/core/endpoints/createClient';
import type { EsiResponse, EsiResponseMeta } from '../../src';

// --- HttpMethod is a string union ---

expectAssignable<HttpMethod>('GET' as const);
expectAssignable<HttpMethod>('POST' as const);
expectAssignable<HttpMethod>('PUT' as const);
expectAssignable<HttpMethod>('DELETE' as const);

// --- EndpointArgs: no params produces empty tuple ---

type NoParamEndpoint = {
  path: 'status/';
  method: 'GET';
  requiresAuth: false;
};
expectType<[]>(null as unknown as EndpointArgs<NoParamEndpoint>);

// --- EndpointArgs: path params produce positional number|string args ---

type OneParamEndpoint = {
  path: 'alliances/{allianceId}/';
  method: 'GET';
  requiresAuth: false;
  pathParams: readonly ['allianceId'];
};
expectType<[number | string]>(
  null as unknown as EndpointArgs<OneParamEndpoint>,
);

type TwoParamEndpoint = {
  path: 'characters/{characterId}/mail/{mailId}/';
  method: 'GET';
  requiresAuth: true;
  pathParams: readonly ['characterId', 'mailId'];
};
expectType<[number | string, number | string]>(
  null as unknown as EndpointArgs<TwoParamEndpoint>,
);

// --- EndpointArgs: hasBody adds body param ---

type BodyEndpoint = {
  path: 'characters/{characterId}/mail/';
  method: 'POST';
  requiresAuth: true;
  pathParams: readonly ['characterId'];
  hasBody: true;
};
expectType<[number | string, body: object]>(
  null as unknown as EndpointArgs<BodyEndpoint>,
);

// --- WithMetadata wraps return types in EsiResponse ---

type SimpleMethods = {
  getStatus: () => Promise<{ players: number }>;
  getInfo: (id: number) => Promise<string>;
};

type WrappedMethods = WithMetadata<SimpleMethods>;

expectType<() => Promise<EsiResponse<{ players: number }>>>(
  null as unknown as WrappedMethods['getStatus'],
);

expectType<(id: number) => Promise<EsiResponse<string>>>(
  null as unknown as WrappedMethods['getInfo'],
);

// --- CreateClientOptions shape ---

expectAssignable<CreateClientOptions>({});
expectAssignable<CreateClientOptions>({ returnMetadata: true });
expectAssignable<CreateClientOptions>({ returnMetadata: false });
