import { ApiClient, FetchLike } from './ApiClient';
import { IRateLimiter } from './rateLimiter/IRateLimiter';
import { RateLimiter } from './rateLimiter/RateLimiter';
import { ICache } from './cache/ICache';
import { CircuitBreaker } from './circuitBreaker/CircuitBreaker';

export class ApiClientBuilder {
  private clientId!: string;
  private link!: string;
  private accessToken?: string;
  private rateLimiter?: IRateLimiter;
  private cache?: ICache;
  private circuitBreaker?: CircuitBreaker;
  private _timeout?: number;
  private _fetch?: FetchLike;

  setClientId(clientId: string): ApiClientBuilder {
    this.clientId = clientId;
    return this;
  }

  setLink(link: string): ApiClientBuilder {
    this.link = link;
    return this;
  }

  setAccessToken(accessToken?: string): ApiClientBuilder {
    this.accessToken = accessToken;
    return this;
  }

  setRateLimiter(limiter: IRateLimiter): ApiClientBuilder {
    this.rateLimiter = limiter;
    return this;
  }

  setCache(cache: ICache): ApiClientBuilder {
    this.cache = cache;
    return this;
  }

  setCircuitBreaker(cb: CircuitBreaker): ApiClientBuilder {
    this.circuitBreaker = cb;
    return this;
  }

  setTimeout(timeout: number): ApiClientBuilder {
    this._timeout = timeout;
    return this;
  }

  setFetch(fn: FetchLike): ApiClientBuilder {
    this._fetch = fn;
    return this;
  }

  build(): ApiClient {
    const client = new ApiClient(this.clientId, this.link, this.accessToken);
    client.setRateLimiter(this.rateLimiter ?? new RateLimiter());
    if (this.cache) client.setCache(this.cache);
    if (this.circuitBreaker) client.setCircuitBreaker(this.circuitBreaker);
    if (this._timeout !== undefined) client.setTimeout(this._timeout);
    if (this._fetch) client.setFetch(this._fetch);
    return client;
  }
}
