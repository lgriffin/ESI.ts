import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';
import { AllianceInfo } from '../../types/api-responses';
import { ApiError } from '../../core/errors/ApiError';

export class AllianceByIdApi {
    constructor(private client: ApiClient) {}

    async getAllianceById(allianceId: number): Promise<AllianceInfo> {
        if (!allianceId || allianceId <= 0) {
            throw ApiError.validationError('Alliance ID must be a positive number');
        }

        return await handleRequest(this.client, `alliances/${allianceId}/`, 'GET', undefined, false);
    }
}
