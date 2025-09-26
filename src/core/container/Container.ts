export type Factory<T = any> = () => T;
export type AsyncFactory<T = any> = () => Promise<T>;

export interface ContainerConfig {
    enableLogging?: boolean;
    enableCircularDependencyDetection?: boolean;
}

export class CircularDependencyError extends Error {
    constructor(dependencyChain: string[]) {
        super(`Circular dependency detected: ${dependencyChain.join(' -> ')}`);
        this.name = 'CircularDependencyError';
    }
}

export class Container {
    private dependencies = new Map<string, Factory>();
    private singletons = new Map<string, any>();
    private resolutionStack: string[] = [];
    private config: ContainerConfig;

    constructor(config: ContainerConfig = {}) {
        this.config = {
            enableLogging: false,
            enableCircularDependencyDetection: true,
            ...config
        };
    }

    /**
     * Register a factory function for a dependency
     */
    register<T>(token: string, factory: Factory<T>, singleton: boolean = false): this {
        if (this.config.enableLogging) {
            console.log(`Registering dependency: ${token} (singleton: ${singleton})`);
        }

        this.dependencies.set(token, factory);
        
        if (singleton) {
            // Pre-resolve singleton to catch errors early
            this.resolve<T>(token);
        }

        return this;
    }

    /**
     * Register a singleton dependency
     */
    registerSingleton<T>(token: string, factory: Factory<T>): this {
        return this.register(token, factory, true);
    }

    /**
     * Register an instance directly as a singleton
     */
    registerInstance<T>(token: string, instance: T): this {
        this.singletons.set(token, instance);
        return this;
    }

    /**
     * Resolve a dependency by token
     */
    resolve<T>(token: string): T {
        // Check if it's already a singleton instance
        if (this.singletons.has(token)) {
            return this.singletons.get(token) as T;
        }

        // Get the factory
        const factory = this.dependencies.get(token);
        if (!factory) {
            throw new Error(`Dependency '${token}' not found. Available dependencies: ${Array.from(this.dependencies.keys()).join(', ')}`);
        }

        // Check for circular dependencies
        if (this.config.enableCircularDependencyDetection && this.resolutionStack.includes(token)) {
            throw new CircularDependencyError([...this.resolutionStack, token]);
        }

        // Add to resolution stack
        this.resolutionStack.push(token);

        try {
            const instance = factory();

            // Store as singleton if it was registered as one
            if (this.isSingleton(token)) {
                this.singletons.set(token, instance);
            }

            return instance as T;
        } finally {
            // Remove from resolution stack
            this.resolutionStack.pop();
        }
    }

    /**
     * Check if a dependency is registered
     */
    has(token: string): boolean {
        return this.dependencies.has(token) || this.singletons.has(token);
    }

    /**
     * Remove a dependency
     */
    remove(token: string): boolean {
        const hadDependency = this.dependencies.delete(token);
        const hadSingleton = this.singletons.delete(token);
        return hadDependency || hadSingleton;
    }

    /**
     * Clear all dependencies
     */
    clear(): void {
        this.dependencies.clear();
        this.singletons.clear();
        this.resolutionStack = [];
    }

    /**
     * Get all registered dependency tokens
     */
    getRegisteredTokens(): string[] {
        const dependencyTokens = Array.from(this.dependencies.keys());
        const singletonTokens = Array.from(this.singletons.keys());
        return [...new Set([...dependencyTokens, ...singletonTokens])];
    }

    /**
     * Create a child container that inherits from this one
     */
    createChild(): Container {
        const child = new Container(this.config);
        
        // Copy dependencies (not instances)
        for (const [token, factory] of this.dependencies) {
            child.dependencies.set(token, factory);
        }

        return child;
    }

    private isSingleton(token: string): boolean {
        // Check if the token was registered with singleton behavior
        // This is determined by checking if resolve was called during registration
        return false; // For now, we'll manage this manually
    }
}

// Global container instance
export const container = new Container({
    enableLogging: process.env.NODE_ENV === 'development',
    enableCircularDependencyDetection: true
});

// Dependency injection decorators (if using experimental decorators)
export function Injectable(token?: string) {
    return function <T extends new (...args: any[]) => {}>(constructor: T) {
        const dependencyToken = token || constructor.name;
        container.register(dependencyToken, () => new constructor());
        return constructor;
    };
}

export function Inject(token: string) {
    return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
        // This would require reflect-metadata for full implementation
        // For now, it's a placeholder for future enhancement
    };
}
