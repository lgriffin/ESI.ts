export type EsiDatasource = 'tranquility' | 'singularity';

export type TokenProvider = () => Promise<string>;

export class ApiClient {
  private datasource?: EsiDatasource;
  private tokenProvider?: TokenProvider;
  private refreshInFlight?: Promise<string>;

  constructor(
    private clientId: string,
    private link: string,
    private accessToken?: string,
  ) {
    this.link = this.link.replace(/\/$/, '');
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
