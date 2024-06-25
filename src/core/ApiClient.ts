export class ApiClient {
    constructor(
        private clientId: string,
        private link: string,
        private accessToken?: string
    ) {
        // Remove trailing slash from the link if present
        this.link = this.link.replace(/\/$/, '');
    }

    getAuthorizationHeader(): string | undefined {
        return this.accessToken ? `Bearer ${this.accessToken}` : undefined;
    }

    getLink(): string {
        return this.link;
    }
}
