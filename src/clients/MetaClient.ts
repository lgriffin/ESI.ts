import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { metaEndpoints } from '../core/endpoints/metaEndpoints';
import { logInfo, logError } from '../core/logger/loggerUtil';

export class MetaClient {
    private api: ReturnType<typeof createClient<typeof metaEndpoints>>;
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
        this.api = createClient(client, metaEndpoints);
    }

    async getSwaggerJson(): Promise<any> {
        return this.api.getSwaggerJson();
    }

    async getSwaggerYaml(): Promise<string> {
        const url = `${this.client.getLink()}/meta/swagger.yaml`;

        logInfo(`Hitting endpoint: ${url}`);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    accept: 'text/yaml, application/x-yaml, text/plain',
                    'User-Agent': 'esiJS/2.0.0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.text();
        } catch (error) {
            if (error instanceof Error) {
                logError(`Error fetching YAML: ${error.message}`);
                throw error;
            } else {
                logError(`Unexpected error: ${error}`);
                throw new Error(String(error));
            }
        }
    }
}
