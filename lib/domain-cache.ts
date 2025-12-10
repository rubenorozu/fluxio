/**
 * In-memory cache for custom domain to tenant slug mapping
 * This reduces database queries in middleware for better performance
 */

interface CacheEntry {
    slug: string;
    timestamp: number;
}

class DomainCache {
    private cache: Map<string, CacheEntry> = new Map();
    private readonly TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

    /**
     * Get tenant slug from cache
     * @param domain - Custom domain to lookup
     * @returns Tenant slug if found and not expired, null otherwise
     */
    get(domain: string): string | null {
        const entry = this.cache.get(domain.toLowerCase());

        if (!entry) {
            return null;
        }

        // Check if expired
        const now = Date.now();
        if (now - entry.timestamp > this.TTL) {
            this.cache.delete(domain.toLowerCase());
            return null;
        }

        return entry.slug;
    }

    /**
     * Set tenant slug in cache
     * @param domain - Custom domain
     * @param slug - Tenant slug
     */
    set(domain: string, slug: string): void {
        this.cache.set(domain.toLowerCase(), {
            slug,
            timestamp: Date.now(),
        });
    }

    /**
     * Invalidate cache entry for a domain
     * @param domain - Custom domain to invalidate
     */
    invalidate(domain: string): void {
        this.cache.delete(domain.toLowerCase());
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.entries()).map(([domain, entry]) => ({
                domain,
                slug: entry.slug,
                age: Date.now() - entry.timestamp,
            })),
        };
    }
}

// Singleton instance
export const domainCache = new DomainCache();
