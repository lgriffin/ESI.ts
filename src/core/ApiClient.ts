export type EsiDatasource = 'tranquility' | 'singularity';

export class ApiClient {
  private datasource?: EsiDatasource;

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
}
