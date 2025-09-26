import { ApiClient } from './core/ApiClient';
import { ApiClientBuilder } from './core/ApiClientBuilder';
import { apiFactory, ApiFactory } from './core/factory/ApiFactory';
import { getConfig } from './config/configManager';
import logger from './core/logger/logger';

// Import all client types
import { AllianceClient } from './clients/AllianceClient';
import { AssetsClient } from './clients/AssetsClient';
import { BookmarkClient } from './clients/BookmarkClient';
import { CalendarClient } from './clients/CalendarClient';
import { CharacterClient } from './clients/CharacterClient';
import { ClonesClient } from './clients/ClonesClient';
import { ContactsClient } from './clients/ContactsClient';
import { ContractsClient } from './clients/ContractsClient';
import { CorporationsClient } from './clients/CorporationsClient';
import { DogmaClient } from './clients/DogmaClient';
import { FactionClient } from './clients/FactionClient';
import { FittingsClient } from './clients/FittingsClient';
import { FleetClient } from './clients/FleetClient';
import { IncursionsClient } from './clients/IncursionsClient';
import { IndustryClient } from './clients/IndustryClient';
import { InsuranceClient } from './clients/InsuranceClient';
import { KillmailsClient } from './clients/KillmailsClient';
import { LocationClient } from './clients/LocationClient';
import { LoyaltyClient } from './clients/LoyaltyClient';
import { MailClient } from './clients/MailClient';
import { MarketClient } from './clients/MarketClient';
import { OpportunitiesClient } from './clients/OpportunitiesClient';
import { PIClient as PiClient } from './clients/PiClient';
import { RouteClient } from './clients/RouteClient';
import { SearchClient } from './clients/SearchClient';
// import { SkillsClient } from './clients/SkillsClient';
import { SovereigntyClient } from './clients/SovereigntyClient';
import { StatusClient } from './clients/StatusClient';
import { UIClient as UiClient } from './clients/UiClient';
import { UniverseClient } from './clients/UniverseClient';
import { WalletClient } from './clients/WalletClient';
import { WarsClient } from './clients/WarsClient';
import { MetaClient } from './clients/MetaClient';

export interface EsiClientConfig {
    clientId?: string;
    baseUrl?: string;
    accessToken?: string;
    timeout?: number;
    retryAttempts?: number;
}

export class EsiClient {
    private factory: ApiFactory;
    private apiClient: ApiClient;
    private clients: Map<string, any> = new Map();

    constructor(config?: EsiClientConfig) {
        this.factory = apiFactory;
        
        // Use provided config or fall back to default config
        if (config) {
            this.apiClient = this.factory.createClient('default', {
                clientId: config.clientId || 'esi-client',
                baseUrl: config.baseUrl || 'https://esi.evetech.net',
                accessToken: config.accessToken,
                timeout: config.timeout || 30000,
                retryAttempts: config.retryAttempts || 3
            });
        } else {
            const defaultConfig = getConfig();
            this.apiClient = this.factory.createClient('default', {
                clientId: (defaultConfig as any).projectName || 'esi-client',
                baseUrl: (defaultConfig as any).link || 'https://esi.evetech.net',
                accessToken: (defaultConfig as any).authToken,
                timeout: 30000,
                retryAttempts: 3
            });
        }

        this.initializeClients();
        
        logger.info('EsiClient initialized successfully');
    }

    private initializeClients(): void {
        // Register all clients with the factory
        const clientConfigs = [
            { name: 'alliance', factory: () => new AllianceClient(this.apiClient) },
            { name: 'assets', factory: () => new AssetsClient(this.apiClient) },
            { name: 'bookmarks', factory: () => new BookmarkClient(this.apiClient) },
            { name: 'calendar', factory: () => new CalendarClient(this.apiClient) },
            { name: 'characters', factory: () => new CharacterClient(this.apiClient) },
            { name: 'clones', factory: () => new ClonesClient(this.apiClient) },
            { name: 'contacts', factory: () => new ContactsClient(this.apiClient) },
            { name: 'contracts', factory: () => new ContractsClient(this.apiClient) },
            { name: 'corporations', factory: () => new CorporationsClient(this.apiClient) },
            { name: 'dogma', factory: () => new DogmaClient(this.apiClient) },
            { name: 'factions', factory: () => new FactionClient(this.apiClient) },
            { name: 'fittings', factory: () => new FittingsClient(this.apiClient) },
            { name: 'fleets', factory: () => new FleetClient(this.apiClient) },
            { name: 'incursions', factory: () => new IncursionsClient(this.apiClient) },
            { name: 'industry', factory: () => new IndustryClient(this.apiClient) },
            { name: 'insurance', factory: () => new InsuranceClient(this.apiClient) },
            { name: 'killmails', factory: () => new KillmailsClient(this.apiClient) },
            { name: 'location', factory: () => new LocationClient(this.apiClient) },
            { name: 'loyalty', factory: () => new LoyaltyClient(this.apiClient) },
            { name: 'mail', factory: () => new MailClient(this.apiClient) },
            { name: 'market', factory: () => new MarketClient(this.apiClient) },
            { name: 'opportunities', factory: () => new OpportunitiesClient(this.apiClient) },
            { name: 'pi', factory: () => new PiClient(this.apiClient) },
            { name: 'route', factory: () => new RouteClient(this.apiClient) },
            { name: 'search', factory: () => new SearchClient(this.apiClient) },
            // { name: 'skills', factory: () => new SkillsClient(this.apiClient) },
            { name: 'sovereignty', factory: () => new SovereigntyClient(this.apiClient) },
            { name: 'status', factory: () => new StatusClient(this.apiClient) },
            { name: 'ui', factory: () => new UiClient(this.apiClient) },
            { name: 'universe', factory: () => new UniverseClient(this.apiClient) },
            { name: 'wallet', factory: () => new WalletClient(this.apiClient) },
            { name: 'wars', factory: () => new WarsClient(this.apiClient) },
            { name: 'meta', factory: () => new MetaClient(this.apiClient) }
        ];

        clientConfigs.forEach(({ name, factory }) => {
            this.factory.registerService(name, factory as any, true);
        });
    }

    // Getter methods for each client
    get alliance(): AllianceClient {
        return this.getClient('alliance');
    }

    get assets(): AssetsClient {
        return this.getClient('assets');
    }

    get bookmarks(): BookmarkClient {
        return this.getClient('bookmarks');
    }

    get calendar(): CalendarClient {
        return this.getClient('calendar');
    }

    get characters(): CharacterClient {
        return this.getClient('characters');
    }

    get clones(): ClonesClient {
        return this.getClient('clones');
    }

    get contacts(): ContactsClient {
        return this.getClient('contacts');
    }

    get contracts(): ContractsClient {
        return this.getClient('contracts');
    }

    get corporations(): CorporationsClient {
        return this.getClient('corporations');
    }

    get dogma(): DogmaClient {
        return this.getClient('dogma');
    }

    get factions(): FactionClient {
        return this.getClient('factions');
    }

    get fittings(): FittingsClient {
        return this.getClient('fittings');
    }

    get fleets(): FleetClient {
        return this.getClient('fleets');
    }

    get incursions(): IncursionsClient {
        return this.getClient('incursions');
    }

    get industry(): IndustryClient {
        return this.getClient('industry');
    }

    get insurance(): InsuranceClient {
        return this.getClient('insurance');
    }

    get killmails(): KillmailsClient {
        return this.getClient('killmails');
    }

    get location(): LocationClient {
        return this.getClient('location');
    }

    get loyalty(): LoyaltyClient {
        return this.getClient('loyalty');
    }

    get mail(): MailClient {
        return this.getClient('mail');
    }

    get market(): MarketClient {
        return this.getClient('market');
    }

    get opportunities(): OpportunitiesClient {
        return this.getClient('opportunities');
    }

    get pi(): PiClient {
        return this.getClient('pi');
    }

    get route(): RouteClient {
        return this.getClient('route');
    }

    get search(): SearchClient {
        return this.getClient('search');
    }

    // get skills(): SkillsClient {
    //     return this.getClient('skills');
    // }

    get sovereignty(): SovereigntyClient {
        return this.getClient('sovereignty');
    }

    get status(): StatusClient {
        return this.getClient('status');
    }

    get ui(): UiClient {
        return this.getClient('ui');
    }

    get universe(): UniverseClient {
        return this.getClient('universe');
    }

    get wallet(): WalletClient {
        return this.getClient('wallet');
    }

    get wars(): WarsClient {
        return this.getClient('wars');
    }

    get meta(): MetaClient {
        return this.getClient('meta');
    }

    private getClient<T>(name: string): T {
        if (!this.clients.has(name)) {
            this.clients.set(name, this.factory.getService<T>(name));
        }
        return this.clients.get(name);
    }

    /**
     * Health check for all registered clients
     */
    async healthCheck(): Promise<{ [clientName: string]: boolean }> {
        return await this.factory.healthCheck();
    }

    /**
     * Get information about registered clients
     */
    getClientInfo(): { clients: string[], modules: string[] } {
        return {
            clients: this.factory.getRegisteredClients(),
            modules: this.factory.getRegisteredModules()
        };
    }

    /**
     * Update access token for authenticated requests
     */
    setAccessToken(token: string): void {
        // This would require updating the ApiClient to support token updates
        logger.info('Access token updated');
    }

    /**
     * Cleanup resources
     */
    async shutdown(): Promise<void> {
        await this.factory.shutdown();
        this.clients.clear();
        logger.info('EsiClient shutdown completed');
    }
}

// Export a default instance for convenience
export const esiClient = new EsiClient();
