export interface IAPIBuilder<T = any> {
    build(): T;
}

export interface IApiClient {
    getAuthorizationHeader(): string | undefined;
    getLink(): string;
}

export interface IApiService {
    readonly name: string;
    readonly version: string;
}
