import { ApiClient } from '../core/ApiClient';
import { GetSwaggerJsonApi } from '../api/meta/getSwaggerJson';
import { GetSwaggerYamlApi } from '../api/meta/getSwaggerYaml';
import { IApiService } from '../core/IAPIBuilder';

export class MetaClient implements IApiService {
    readonly name = 'MetaClient';
    readonly version = '1.0.0';
    private getSwaggerJsonApi: GetSwaggerJsonApi;
    private getSwaggerYamlApi: GetSwaggerYamlApi;

    constructor(client: ApiClient) {
        this.getSwaggerJsonApi = new GetSwaggerJsonApi(client);
        this.getSwaggerYamlApi = new GetSwaggerYamlApi(client);
    }

    async getSwaggerJson(): Promise<any> {
        return await this.getSwaggerJsonApi.getSwaggerJson();
    }

    async getSwaggerYaml(): Promise<string> {
        return await this.getSwaggerYamlApi.getSwaggerYaml();
    }
}
