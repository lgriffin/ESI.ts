import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { allianceEndpoints } from '../core/endpoints/allianceEndpoints';
import { AllianceInfo, AllianceContact, AllianceContactLabel, AllianceIcon } from '../types/api-responses';

export class AllianceClient {
    private api: ReturnType<typeof createClient<typeof allianceEndpoints>>;
    private _client: ApiClient;
    private _metaApi?: ReturnType<typeof createClient<typeof allianceEndpoints>>;

    constructor(client: ApiClient) {
        this._client = client;
        this.api = createClient(client, allianceEndpoints);
    }

    /**
     * Retrieve public information about an alliance.
     *
     * @param allianceId - The ID of the alliance to look up
     * @returns Public alliance information including name, ticker, and founding date
     */
    async getAllianceById(allianceId: number): Promise<AllianceInfo> {
        return this.api.getAllianceById(allianceId);
    }

    /**
     * Retrieve contacts for an alliance.
     *
     * @param allianceId - The ID of the alliance whose contacts to retrieve
     * @returns A list of alliance contacts with standings and contact types
     * @requires Authentication
     */
    async getContacts(allianceId: number): Promise<AllianceContact[]> {
        return this.api.getContacts(allianceId);
    }

    /**
     * Retrieve custom contact labels for an alliance.
     *
     * @param allianceId - The ID of the alliance whose contact labels to retrieve
     * @returns A list of custom labels used to categorize alliance contacts
     * @requires Authentication
     */
    async getContactLabels(allianceId: number): Promise<AllianceContactLabel[]> {
        return this.api.getContactLabels(allianceId);
    }

    /**
     * Retrieve the list of corporation IDs that are members of an alliance.
     *
     * @param allianceId - The ID of the alliance whose member corporations to retrieve
     * @returns An array of corporation IDs belonging to the alliance
     */
    async getCorporations(allianceId: number): Promise<number[]> {
        return this.api.getCorporations(allianceId);
    }

    /**
     * Retrieve icon URLs for an alliance.
     *
     * @param allianceId - The ID of the alliance whose icons to retrieve
     * @returns Icon URLs at various resolutions for the alliance
     */
    async getIcons(allianceId: number): Promise<AllianceIcon> {
        return this.api.getIcons(allianceId);
    }

    /**
     * Retrieve a list of all active alliance IDs in EVE Online.
     *
     * @returns An array of all active alliance IDs
     */
    async getAlliances(): Promise<number[]> {
        return this.api.getAlliances();
    }

    withMetadata(): WithMetadata<Omit<AllianceClient, 'withMetadata'>> {
        if (!this._metaApi) {
            this._metaApi = createClient(this._client, allianceEndpoints, { returnMetadata: true });
        }
        return this._metaApi as unknown as WithMetadata<Omit<AllianceClient, 'withMetadata'>>;
    }
}
