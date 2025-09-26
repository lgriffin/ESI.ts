import { logInfo, logDebug, logWarn } from '../logger/loggerUtil';

export interface CacheEntry {
    etag: string;
    data: any;
    headers: Record<string, string>;
    timestamp: number;
    ttl?: number; // Time to live in milliseconds
}

export interface ETagCacheConfig {
    maxEntries?: number;
    defaultTtl?: number; // Default TTL in milliseconds
    cleanupInterval?: number; // Cleanup interval in milliseconds
    persistToStorage?: boolean;
    storageKey?: string;
}

export class ETagCacheManager {
    private cache: Map<string, CacheEntry> = new Map();
    private config: Required<ETagCacheConfig>;
    private cleanupTimer?: NodeJS.Timeout;

    constructor(config: ETagCacheConfig = {}) {
        this.config = {
            maxEntries: config.maxEntries ?? 1000,
            defaultTtl: config.defaultTtl ?? 5 * 60 * 1000, // 5 minutes default
            cleanupInterval: config.cleanupInterval ?? 60 * 1000, // 1 minute cleanup
            persistToStorage: config.persistToStorage ?? false,
            storageKey: config.storageKey ?? 'esi-etag-cache'
        };

        if (this.config.persistToStorage) {
            this.loadFromStorage();
        }

        this.startCleanupTimer();
        logInfo(`ETag cache manager initialized with ${this.config.maxEntries} max entries`);
    }

    /**
     * Get cached data if ETag matches
     */
    get(url: string): CacheEntry | null {
        const entry = this.cache.get(url);
        
        if (!entry) {
            return null;
        }

        // Check if entry has expired
        if (this.isExpired(entry)) {
            this.cache.delete(url);
            logDebug(`Cache entry expired for ${url}`);
            return null;
        }

        logDebug(`Cache hit for ${url} with ETag ${entry.etag}`);
        return entry;
    }

    /**
     * Get ETag for a URL (for If-None-Match header)
     */
    getETag(url: string): string | null {
        const entry = this.get(url);
        return entry ? entry.etag : null;
    }

    /**
     * Set cache entry
     */
    set(url: string, etag: string, data: any, headers: Record<string, string>, customTtl?: number): void {
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.config.maxEntries) {
            this.evictOldest();
        }

        const entry: CacheEntry = {
            etag,
            data,
            headers,
            timestamp: Date.now(),
            ttl: customTtl ?? this.config.defaultTtl
        };

        this.cache.set(url, entry);
        logDebug(`Cached response for ${url} with ETag ${etag}`);

        if (this.config.persistToStorage) {
            this.saveToStorage();
        }
    }

    /**
     * Check if cached data exists and is valid
     */
    has(url: string): boolean {
        const entry = this.cache.get(url);
        return entry !== undefined && !this.isExpired(entry);
    }

    /**
     * Clear specific cache entry
     */
    delete(url: string): boolean {
        const deleted = this.cache.delete(url);
        if (deleted && this.config.persistToStorage) {
            this.saveToStorage();
        }
        return deleted;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        if (this.config.persistToStorage) {
            this.saveToStorage();
        }
        logInfo('ETag cache cleared');
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        totalEntries: number;
        maxEntries: number;
        hitRate: number;
        oldestEntry: number | null;
        newestEntry: number | null;
    } {
        const entries = Array.from(this.cache.values());
        const timestamps = entries.map(e => e.timestamp);
        
        return {
            totalEntries: this.cache.size,
            maxEntries: this.config.maxEntries,
            hitRate: 0, // Would need to track hits/misses for this
            oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
            newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
        };
    }

    /**
     * Update cache configuration
     */
    updateConfig(newConfig: Partial<ETagCacheConfig>): void {
        this.config = { ...this.config, ...newConfig };
        logInfo('ETag cache configuration updated');
    }

    /**
     * Cleanup expired entries
     */
    cleanup(): number {
        const beforeSize = this.cache.size;
        const now = Date.now();
        const expiredKeys: string[] = [];

        for (const [url, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                expiredKeys.push(url);
            }
        }

        expiredKeys.forEach(key => this.cache.delete(key));

        const cleanedCount = beforeSize - this.cache.size;
        if (cleanedCount > 0) {
            logDebug(`Cleaned up ${cleanedCount} expired cache entries`);
            if (this.config.persistToStorage) {
                this.saveToStorage();
            }
        }

        return cleanedCount;
    }

    /**
     * Shutdown cache manager
     */
    shutdown(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        if (this.config.persistToStorage) {
            this.saveToStorage();
        }
        logInfo('ETag cache manager shut down');
    }

    private isExpired(entry: CacheEntry): boolean {
        if (!entry.ttl) return false;
        return Date.now() - entry.timestamp > entry.ttl;
    }

    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            logDebug(`Evicted oldest cache entry: ${oldestKey}`);
        }
    }

    private startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
    }

    private loadFromStorage(): void {
        try {
            if (typeof localStorage !== 'undefined') {
                const stored = localStorage.getItem(this.config.storageKey);
                if (stored) {
                    const data = JSON.parse(stored);
                    this.cache = new Map(data);
                    logInfo(`Loaded ${this.cache.size} entries from storage`);
                }
            }
        } catch (error) {
            logWarn(`Failed to load cache from storage: ${error}`);
        }
    }

    private saveToStorage(): void {
        try {
            if (typeof localStorage !== 'undefined') {
                const data = Array.from(this.cache.entries());
                localStorage.setItem(this.config.storageKey, JSON.stringify(data));
            }
        } catch (error) {
            logWarn(`Failed to save cache to storage: ${error}`);
        }
    }
}
