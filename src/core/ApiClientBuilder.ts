import { ApiClient } from './ApiClient';

export class ApiClientBuilder {
    private clientId!: string;
    private link!: string;
    private accessToken?: string; // Make accessToken optional

    setClientId(clientId: string): ApiClientBuilder {
        this.clientId = clientId;
        return this;
    }

    setLink(link: string): ApiClientBuilder {
        this.link = link;
        return this;
    }

    setAccessToken(accessToken?: string): ApiClientBuilder { // Update method to accept optional token
        this.accessToken = accessToken;
        return this;
    }

    build(): ApiClient {
        return new ApiClient(this.clientId, this.link, this.accessToken);
    }
}
