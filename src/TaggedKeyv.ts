import Keyv from '@keyvhq/core';
import { KeyvTagManager } from './KeyvTagManager';
import type { TagManager } from './TagManager';

export class TaggedKeyv {
    protected cache: Keyv;
    private tagManager: TagManager;
    private locks: Map<string, Promise<void>> = new Map();

    constructor(cache?: Keyv, tagManager?: TagManager) {
        this.cache = cache || new Keyv();
        this.tagManager = tagManager || new KeyvTagManager(this.cache);
    }

    /**
     * Simple mutex-like mechanism to prevent race conditions on key operations
     */
    private async withLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
        const lockKey = `lock:${key}`;

        // Wait for any existing lock to complete
        const existingLock = this.locks.get(lockKey);
        if (existingLock) {
            await existingLock;
        }

        // Create a new lock
        const lockPromise = (async () => {
            try {
                return await operation();
            } finally {
                this.locks.delete(lockKey);
            }
        })();

        this.locks.set(
            lockKey,
            lockPromise.then(() => undefined)
        );
        return lockPromise;
    }

    /**
     * Sets a value with optional TTL and associated tags.
     * Maintains Keyv compatibility while adding tag support.
     */
    async set<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void>;
    async set<T>(key: string, value: T, options?: { ttl?: number; tags?: string[] }): Promise<void>;
    async set<T>(
        key: string,
        value: T,
        ttlOrOptions?: number | { ttl?: number; tags?: string[] },
        tags: string[] = []
    ): Promise<void> {
        return this.withLock(key, async () => {
            // Parse parameters to handle both API forms
            let ttl: number | undefined;
            let finalTags: string[];

            if (typeof ttlOrOptions === 'object' && ttlOrOptions !== null) {
                // New API: set(key, value, { ttl, tags })
                ttl = ttlOrOptions.ttl;
                finalTags = ttlOrOptions.tags || [];
            } else {
                // Legacy API: set(key, value, ttl, tags)
                ttl = ttlOrOptions;
                finalTags = tags;
            }

            // First, set the main value
            try {
                await this.cache.set(key, value, ttl);
            } catch (error) {
                throw new Error(
                    `Failed to set key "${key}": ${error instanceof Error ? error.message : String(error)}`
                );
            }

            // Set tags if provided
            if (finalTags.length > 0) {
                try {
                    await this.tagManager.setTagsForKey(key, finalTags);
                } catch (error) {
                    // Cleanup: remove the key if tag setting failed
                    await this.cleanupFailedSet(key);
                    throw new Error(
                        `Failed to set tags for key "${key}": ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }
        });
    }

    /**
     * Cleanup helper for failed set operations
     */
    private async cleanupFailedSet(key: string): Promise<void> {
        try {
            // Remove the main key
            await this.cache.delete(key);

            // Remove key from all tag associations
            await this.tagManager.deleteKeyFromAllTags(key);
        } catch (cleanupError) {
            // Log cleanup errors but don't throw to avoid masking original error
            console.error('Failed to cleanup after set operation failure:', cleanupError);
        }
    }

    /**
     * Gets a value by key.
     */
    async get<T>(key: string): Promise<T | undefined> {
        try {
            return await this.cache.get(key);
        } catch (error) {
            throw new Error(`Failed to get key "${key}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Deletes a key and removes it from all associated tag indexes.
     */
    async delete(key: string): Promise<boolean> {
        return this.withLock(key, async () => {
            try {
                // Remove key from all tag associations
                try {
                    await this.tagManager.deleteKeyFromAllTags(key);
                } catch (error) {
                    // Log tag cleanup errors but don't fail the operation
                    console.error('Error during tag cleanup for key deletion:', error);
                }

                // Delete the main key
                const deleted = await this.cache.delete(key);
                return deleted;
            } catch (error) {
                throw new Error(
                    `Failed to delete key "${key}": ${error instanceof Error ? error.message : String(error)}`
                );
            }
        });
    }

    /**
     * Invalidates all keys associated with a given tag.
     */
    async invalidateTag(tag: string): Promise<void> {
        try {
            const keys = await this.tagManager.getKeysForTag(tag);
            if (keys.length === 0) return;

            const errors: Error[] = [];

            // Delete all keys associated with this tag
            for (const key of keys) {
                try {
                    await this.cache.delete(key);
                } catch (error) {
                    errors.push(
                        new Error(
                            `Failed to delete key "${key}" for tag "${tag}": ${error instanceof Error ? error.message : String(error)}`
                        )
                    );
                }
            }

            // Delete the tag and all its associations
            try {
                await this.tagManager.deleteTag(tag);
            } catch (error) {
                errors.push(
                    new Error(
                        `Failed to delete tag metadata for "${tag}": ${error instanceof Error ? error.message : String(error)}`
                    )
                );
            }

            // If there were errors, log them
            if (errors.length > 0) {
                console.error(`Errors during invalidation of tag "${tag}":`, errors);
            }
        } catch (error) {
            throw new Error(
                `Failed to invalidate tag "${tag}": ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Retrieves all key-value pairs associated with a tag.
     */
    async getByTag<T>(tag: string, options?: { page?: number; limit?: number }): Promise<Array<[string, T]>> {
        try {
            const allKeys = await this.tagManager.getKeysForTag(tag);
            if (allKeys.length === 0) return [];

            const { page = 1, limit = 50 } = options || {};

            // Ensure page is at least 1
            const currentPage = Math.max(1, page);

            const offset = (currentPage - 1) * limit;
            const end = offset + limit;
            const keysToFetch = allKeys.slice(offset, end);

            if (keysToFetch.length === 0) return [];

            const results: Array<[string, T]> = [];
            const errors: Error[] = [];
            let deadKeys = 0;

            for (const key of keysToFetch) {
                try {
                    const val = await this.cache.get(key);
                    if (val !== undefined) {
                        results.push([key, val as T]);
                    } else {
                        deadKeys++;
                    }
                } catch (error) {
                    errors.push(
                        new Error(
                            `Failed to get key "${key}" for tag "${tag}": ${error instanceof Error ? error.message : String(error)}`
                        )
                    );
                }
            }

            // If we found dead keys, compact the tag array
            if (deadKeys > 0) {
                try {
                    await this.tagManager.compact([tag]);
                } catch (compactError) {
                    console.error(`Failed to compact tag array for "${tag}":`, compactError);
                }
            }

            // Log errors but don't fail the operation
            if (errors.length > 0) {
                console.error(`Errors during getByTag for tag "${tag}":`, errors);
            }

            return results;
        } catch (error) {
            throw new Error(
                `Failed to get entries for tag "${tag}": ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Clears all keys and tag metadata.
     */
    async clear(): Promise<void> {
        try {
            await this.cache.clear();
            await this.tagManager.clear();
        } catch (error) {
            throw new Error(`Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Bulk invalidation of multiple tags.
     */
    async invalidateTags(tags: string[]): Promise<void> {
        const errors: Error[] = [];

        for (const tag of tags) {
            try {
                await this.invalidateTag(tag);
            } catch (error) {
                errors.push(error instanceof Error ? error : new Error(String(error)));
            }
        }

        if (errors.length > 0) {
            throw new Error(`Failed to invalidate some tags: ${errors.map((e) => e.message).join(', ')}`);
        }
    }

    /**
     * Bulk set operation for multiple key-value pairs with optional tags.
     */
    async setMany<T>(entries: Array<[string, T, string[]?]>): Promise<void> {
        const errors: Error[] = [];

        for (const [key, value, tags] of entries) {
            try {
                await this.set(key, value, undefined, tags);
            } catch (error) {
                errors.push(error instanceof Error ? error : new Error(String(error)));
            }
        }

        if (errors.length > 0) {
            throw new Error(`Failed to set some entries: ${errors.map((e) => e.message).join(', ')}`);
        }
    }

    /**
     * Check if a key exists in the cache.
     */
    async has(key: string): Promise<boolean> {
        try {
            const value = await this.cache.get(key);
            return value !== undefined;
        } catch (error) {
            throw new Error(
                `Failed to check if key "${key}" exists: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Compact tag arrays by removing duplicates and dead keys.
     * Call this periodically to improve memory efficiency.
     */
    async compactTags(tags?: string[]): Promise<void> {
        try {
            await this.tagManager.compact(tags);
        } catch (error) {
            throw new Error(`Failed to compact tags: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Retrieves a list of all unique tags currently in use across the cache.
     */
    async getAllTags(): Promise<string[]> {
        try {
            return await this.tagManager.getAllTags();
        } catch (error) {
            throw new Error(`Failed to get all tags: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Retrieves all tags associated with a specific key.
     */
    async getTagsForKey(key: string): Promise<string[]> {
        try {
            return await this.tagManager.getTagsForKey(key);
        } catch (error) {
            throw new Error(
                `Failed to get tags for key "${key}": ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}
