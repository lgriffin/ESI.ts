import { ApiClient } from '../ApiClient';
import { Container } from '../container/Container';
import { ApiError, ApiErrorType, ErrorHandler } from '../errors/ApiError';
import logger from '../logger/logger';

export interface ApiClientConfig {
    clientId: string;
    baseUrl: string;
    accessToken?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}

export interface ApiModuleConfig {
    name: string;
    version: string;
    dependencies?: string[];
}

export abstract class ApiModule {
    abstract readonly config: ApiModuleConfig;
    
    constructor(protected client: ApiClient, protected container: Container) {}
    
    abstract register(): void;
}

export class ApiFactory {
    private static instance: ApiFactory;
    private container: Container;
    private clients = new Map<string, ApiClient>();
    private modules = new Map<string, ApiModule>();

    private constructor() {
        this.container = new Container({
            enableLogging: process.env.NODE_ENV === 'development',
            enableCircularDependencyDetection: true
        });
        this.registerCoreServices();
    }

    static getInstance(): ApiFactory {
        if (!this.instance) {
            this.instance = new ApiFactory();
        }
        return this.instance;
    }

    /**
     * Register core services in the container
     */
    private registerCoreServices(): void {
        this.container.registerInstance('logger', logger);
        this.container.registerInstance('errorHandler', ErrorHandler);
    }

    /**
     * Create and register an API client
     */
    createClient(name: string, config: ApiClientConfig): ApiClient {
        try {
            const client = new ApiClient(
                config.clientId,
                config.baseUrl,
                config.accessToken
            );

            this.clients.set(name, client);
            this.container.registerInstance(`client:${name}`, client);

            logger.info(`API client '${name}' created and registered`);
            return client;
        } catch (error) {
            logger.error(`Failed to create API client '${name}':`, error);
            throw ErrorHandler.handle(error);
        }
    }

    /**
     * Get an existing API client
     */
    getClient(name: string): ApiClient {
        const client = this.clients.get(name);
        if (!client) {
            throw new ApiError(
                `API client '${name}' not found. Available clients: ${Array.from(this.clients.keys()).join(', ')}`,
                ApiErrorType.CLIENT_ERROR
            );
        }
        return client;
    }

    /**
     * Register an API module
     */
    registerModule(module: ApiModule): void {
        try {
            // Check dependencies
            if (module.config.dependencies) {
                for (const dependency of module.config.dependencies) {
                    if (!this.container.has(dependency)) {
                        throw new ApiError(
                            `Module '${module.config.name}' requires dependency '${dependency}' which is not registered`,
                            ApiErrorType.VALIDATION_ERROR
                        );
                    }
                }
            }

            // Register the module
            module.register();
            this.modules.set(module.config.name, module);
            this.container.registerInstance(`module:${module.config.name}`, module);

            logger.info(`API module '${module.config.name}' v${module.config.version} registered`);
        } catch (error) {
            logger.error(`Failed to register module '${module.config.name}':`, error);
            throw ErrorHandler.handle(error);
        }
    }

    /**
     * Get a service from the container
     */
    getService<T>(token: string): T {
        try {
            return this.container.resolve<T>(token);
        } catch (error) {
            logger.error(`Failed to resolve service '${token}':`, error);
            throw ErrorHandler.handle(error);
        }
    }

    /**
     * Register a service in the container
     */
    registerService<T>(token: string, factory: () => T, singleton: boolean = false): void {
        try {
            this.container.register(token, factory, singleton);
            logger.debug(`Service '${token}' registered (singleton: ${singleton})`);
        } catch (error) {
            logger.error(`Failed to register service '${token}':`, error);
            throw ErrorHandler.handle(error);
        }
    }

    /**
     * Get all registered clients
     */
    getRegisteredClients(): string[] {
        return Array.from(this.clients.keys());
    }

    /**
     * Get all registered modules
     */
    getRegisteredModules(): string[] {
        return Array.from(this.modules.keys());
    }

    /**
     * Health check for all registered clients
     */
    async healthCheck(): Promise<{ [clientName: string]: boolean }> {
        const results: { [clientName: string]: boolean } = {};

        for (const [name, client] of this.clients) {
            try {
                // Perform a simple health check (this would need to be implemented in ApiClient)
                // For now, just check if client exists and has required properties
                results[name] = !!(client && client.getLink());
            } catch (error) {
                logger.warn(`Health check failed for client '${name}':`, error);
                results[name] = false;
            }
        }

        return results;
    }

    /**
     * Shutdown factory and cleanup resources
     */
    async shutdown(): Promise<void> {
        try {
            // Cleanup modules
            for (const [name, module] of this.modules) {
                logger.debug(`Shutting down module: ${name}`);
                // If modules have cleanup methods, call them here
            }

            // Clear containers
            this.container.clear();
            this.clients.clear();
            this.modules.clear();

            logger.info('ApiFactory shutdown completed');
        } catch (error) {
            logger.error('Error during ApiFactory shutdown:', error);
            throw ErrorHandler.handle(error);
        }
    }
}

// Export singleton instance
export const apiFactory = ApiFactory.getInstance();
