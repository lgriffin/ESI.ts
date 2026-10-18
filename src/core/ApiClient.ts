import {
  MiddlewareManager,
  RequestInterceptor,
  ResponseInterceptor,
} from './middleware/Middleware';
import { ICache } from './cache/ICache';
import { IRateLimiter } from './rateLimiter/IRateLimiter';
import { ICircuitBreaker } from './circuitBreaker/ICircuitBreaker';
import { IDeduplicator } from './IDeduplicator';
import { IRetryStrategy } from './IRetryStrategy';
import { RetryConfig } from './util/retry';
import type { ILogger } from './logger/ILogger';
import type { Clock } from './ports/Clock';
import type { Identity } from './ports/Identity';
import { validateHeaderOption } from './util/validation';
import type { IncompletePagesMode } from './pagination/pageLimit';

export type EsiDatasource = 'tranquility' | 'singularity';

// One type for the setter and the identity helpers: the port's.
import type { TokenProvider } from './ports/TokenProvider';
export type { TokenProvider };

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class ApiClient {
  private datasource?: EsiDatasource | undefined;
  private tokenProvider?: TokenProvider | undefined;
  private refreshInFlight?: Promise<string> | undefined;
  private middleware: MiddlewareManager = new MiddlewareManager();
  private cache: ICache | null = null;
  private rateLimiter: IRateLimiter | null = null;
  private circuitBreaker: ICircuitBreaker | null = null;
  private timeout: number = 30_000;
  private deduplicator: IDeduplicator | null = null;
  private retryConfig: RetryConfig | null = null;
  private retryStrategy: IRetryStrategy | null = null;
  private validateResponse: boolean = true;
  private validateRequest: boolean = false;
  private incompletePages: IncompletePagesMode = 'truncate';
  private language?: string | undefined;
  private tenant?: string | undefined;
  private userAgent?: string | undefined;
  private compatibilityDate?: string | undefined;
  private fetchFn: FetchLike | null = null;
  private logger: ILogger | null = null;
  private clock: Clock | null = null;
  private identity: Identity | null = null;
  /** Bumped by a refresh or `setAccessToken`, so a lookup that returns late cannot undo either. */
  private tokenWrites = 0;

  constructor(
    private clientId: string,
    private link: string,
    private accessToken?: string,
  ) {
    this.link = this.link.replace(/\/$/, '');
  }

  getTimeout(): number {
    return this.timeout;
  }

  setTimeout(timeout: number): void {
    this.timeout = timeout;
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

  getCircuitBreaker(): ICircuitBreaker | null {
    return this.circuitBreaker;
  }

  setCircuitBreaker(cb: ICircuitBreaker | null): void {
    this.circuitBreaker = cb;
  }

  getDeduplicator(): IDeduplicator | null {
    return this.deduplicator;
  }

  setDeduplicator(dedup: IDeduplicator | null): void {
    this.deduplicator = dedup;
  }

  getRetryConfig(): RetryConfig | null {
    return this.retryConfig;
  }

  setRetryConfig(config: RetryConfig | null): void {
    this.retryConfig = config;
  }

  getRetryStrategy(): IRetryStrategy | null {
    return this.retryStrategy;
  }

  setRetryStrategy(strategy: IRetryStrategy | null): void {
    this.retryStrategy = strategy;
  }

  getValidateResponse(): boolean {
    return this.validateResponse;
  }

  setValidateResponse(validate: boolean): void {
    this.validateResponse = validate;
  }

  getValidateRequest(): boolean {
    return this.validateRequest;
  }

  setValidateRequest(validate: boolean): void {
    this.validateRequest = validate;
  }

  /** What a pagination path does with a walk it cannot prove complete. */
  getIncompletePages(): IncompletePagesMode {
    return this.incompletePages;
  }

  setIncompletePages(mode: IncompletePagesMode): void {
    this.incompletePages = mode;
  }

  getFetch(): FetchLike {
    return this.fetchFn ?? globalThis.fetch;
  }

  setFetch(fn: FetchLike): void {
    this.fetchFn = fn;
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

  getClientId(): string {
    return this.clientId;
  }

  getDatasource(): EsiDatasource | undefined {
    return this.datasource;
  }

  setDatasource(datasource: EsiDatasource | undefined): void {
    this.datasource = datasource;
  }

  getLanguage(): string | undefined {
    return this.language;
  }

  setLanguage(language: string | undefined): void {
    this.language = language;
  }

  /** The `X-Tenant` every request names, or undefined for ESI's default. */
  getTenant(): string | undefined {
    return this.tenant;
  }

  /** @throws VALIDATION_ERROR when the value is not printable ASCII. */
  setTenant(tenant: string | undefined): void {
    this.tenant =
      tenant === undefined ? undefined : validateHeaderOption('tenant', tenant);
  }

  /** The application's own user agent, sent ahead of the library's. */
  getUserAgent(): string | undefined {
    return this.userAgent;
  }

  /** @throws VALIDATION_ERROR when the value is not printable ASCII. */
  setUserAgent(userAgent: string | undefined): void {
    this.userAgent =
      userAgent === undefined
        ? undefined
        : validateHeaderOption('userAgent', userAgent);
  }

  getCompatibilityDate(): string | undefined {
    return this.compatibilityDate;
  }

  setCompatibilityDate(date: string | undefined): void {
    this.compatibilityDate = date;
  }

  setAccessToken(token: string): void {
    this.tokenWrites++;
    this.accessToken = token;
  }

  setTokenProvider(provider: TokenProvider | undefined): void {
    this.tokenProvider = provider;
  }

  getLogger(): ILogger | null {
    return this.logger;
  }

  setLogger(logger: ILogger | null): void {
    this.logger = logger;
  }

  /**
   * The clock the pipeline reads time from and waits on (cache age, retry
   * back-off, response time), or null for the wall clock and real timers.
   */
  getClock(): Clock | null {
    return this.clock;
  }

  setClock(clock: Clock | null): void {
    this.clock = clock;
  }

  /**
   * A client that sends as `identity` and shares everything else with this
   * one: the cache, rate limiter, circuit breaker, deduplicator, retry
   * policy, interceptors, transport, logger, clock and settings. The
   * middleware objects carry a client back-reference for logging only, so
   * sharing them is sound; the cache and deduplicator scope their keys by
   * the token each client sends. Settings changed on this client afterwards
   * do not reach the view; interceptors added afterwards do, since the two
   * share one middleware chain (so `EsiClient.as` views refuse to add one).
   *
   * Before each authenticated request the view asks the identity for its
   * token, and after a 401 it asks `refreshAccessToken` when the identity can
   * refresh. Backs `esi.as(identity)` and the custom clients' `as(identity)`.
   */
  forIdentity(identity: Identity): ApiClient {
    const view = new ApiClient(this.clientId, this.link);
    view.datasource = this.datasource;
    view.middleware = this.middleware;
    view.cache = this.cache;
    view.rateLimiter = this.rateLimiter;
    view.circuitBreaker = this.circuitBreaker;
    view.timeout = this.timeout;
    view.deduplicator = this.deduplicator;
    view.retryConfig = this.retryConfig;
    view.retryStrategy = this.retryStrategy;
    view.validateResponse = this.validateResponse;
    view.validateRequest = this.validateRequest;
    view.incompletePages = this.incompletePages;
    view.language = this.language;
    view.tenant = this.tenant;
    view.userAgent = this.userAgent;
    view.compatibilityDate = this.compatibilityDate;
    view.fetchFn = this.fetchFn;
    view.logger = this.logger;
    view.clock = this.clock;
    view.identity = identity;
    if (identity.refreshAccessToken) {
      view.tokenProvider = () => identity.refreshAccessToken!();
    }
    return view;
  }

  /** The identity this client sends as, when it was made by `forIdentity`. */
  getIdentity(): Identity | null {
    return this.identity;
  }

  /**
   * Asks the identity for the token to send now, before an authenticated
   * request, so a holder that refreshes ahead of expiry is honoured. Does
   * nothing for a public request or a client with no identity.
   */
  async prepareToken(requiresAuth: boolean): Promise<void> {
    if (!requiresAuth || this.identity === null) return;
    const started = this.tokenWrites;
    const token = await this.identity.accessToken();
    // A refresh has written since this lookup started: keep its token.
    if (this.tokenWrites === started) this.accessToken = token;
  }

  hasTokenProvider(): boolean {
    return this.tokenProvider !== undefined;
  }

  toJSON(): Record<string, unknown> {
    return {
      link: this.link,
      datasource: this.datasource,
      timeout: this.timeout,
      hasCache: this.cache !== null,
      hasRateLimiter: this.rateLimiter !== null,
      hasCircuitBreaker: this.circuitBreaker !== null,
      hasDeduplicator: this.deduplicator !== null,
      hasTokenProvider: this.tokenProvider !== undefined,
      validateResponse: this.validateResponse,
      validateRequest: this.validateRequest,
      language: this.language,
      compatibilityDate: this.compatibilityDate,
    };
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
        this.tokenWrites++;
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
