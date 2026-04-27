import {
  MiddlewareManager,
  RequestInterceptor,
  ResponseInterceptor,
} from './middleware/Middleware';
import { ICache } from './cache/ICache';
import { IRateLimiter } from './rateLimiter/IRateLimiter';
import { CircuitBreaker } from './circuitBreaker/CircuitBreaker';

export type EsiDatasource = 'tranquility' | 'singularity';

export type TokenProvider = () => Promise<string>;

export class ApiClient {
  private datasource?: EsiDatasource;
  private tokenProvider?: TokenProvider;
  private refreshInFlight?: Promise<string>;
  private middleware: MiddlewareManager = new MiddlewareManager();
  private cache: ICache | null = null;
  private rateLimiter: IRateLimiter | null = null;
  private circuitBreaker: CircuitBreaker | null = null;

  constructor(
    private clientId: string,
    private link: string,
    private accessToken?: string,
  ) {
    this.link = this.link.replace(/\/$/, '');
  }

  getCache(): ICache | null {
    return this.cache;
  }

  setCache(cache: ICache | null): void {
    this.cache = cache;
  }

  getRateLimiter(): IRateLimiter | null {
    return this.rateLimiter;
  }

  setRateLimiter(limiter: IRateLimiter | null): void {
    this.rateLimiter = limiter;
  }

  getCircuitBreaker(): CircuitBreaker | null {
    return this.circuitBreaker;
  }

  setCircuitBreaker(cb: CircuitBreaker | null): void {
    this.circuitBreaker = cb;
  }

  getMiddleware(): MiddlewareManager {
    return this.middleware;
  }

  addRequestInterceptor(fn: RequestInterceptor): () => void {
    return this.middleware.addRequestInterceptor(fn);
  }

  addResponseInterceptor(fn: ResponseInterceptor): () => void {
    return this.middleware.addResponseInterceptor(fn);
  }

  getAuthorizationHeader(): string | undefined {
    return this.accessToken ? `Bearer ${this.accessToken}` : undefined;
  }

  getLink(): string {
    return this.link;
  }

  getDatasource(): EsiDatasource | undefined {
    return this.datasource;
  }

  setDatasource(datasource: EsiDatasource | undefined): void {
    this.datasource = datasource;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  setTokenProvider(provider: TokenProvider | undefined): void {
    this.tokenProvider = provider;
  }

  hasTokenProvider(): boolean {
    return this.tokenProvider !== undefined;
  }

  async refreshToken(): Promise<string> {
    if (!this.tokenProvider) {
      throw new Error('No token provider configured');
    }

    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = this.tokenProvider().then(
      (token) => {
        this.accessToken = token;
        this.refreshInFlight = undefined;
        return token;
      },
      (err) => {
        this.refreshInFlight = undefined;
        throw err;
      },
    );

    return this.refreshInFlight;
  }
}
