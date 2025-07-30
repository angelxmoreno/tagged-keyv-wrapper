import type Keyv from '@keyvhq/core';
import type { TagManager } from './TagManager';

const TAG_PREFIX = '__tag__:';
const KEY_TAGS_PREFIX = '__tags__:';

// Type guard function
function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * TagManager implementation using Keyv for storage
 */
export class KeyvTagManager implements TagManager {
    constructor(private cache: Keyv) {}

    private getTagKey(tag: string): string {
        return `${TAG_PREFIX}${tag}`;
    }

    private getKeyTagMapKey(key: string): string {
        return `${KEY_TAGS_PREFIX}${key}`;
    }

    async addKeyToTag(key: string, tag: string): Promise<void> {
        const tagKey = this.getTagKey(tag);
        const existing = await this.cache.get(tagKey);
        const existingArray = isStringArray(existing) ? existing : [];

        // Only update if key doesn't already exist in the array
        if (!existingArray.includes(key)) {
            const updated = [...existingArray, key];
            await this.cache.set(tagKey, updated);
        }
    }

    async removeKeyFromTag(key: string, tag: string): Promise<void> {
        const tagKey = this.getTagKey(tag);
        const existing = await this.cache.get(tagKey);

        if (isStringArray(existing)) {
            const updated = existing.filter((k) => k !== key);
            if (updated.length > 0) {
                await this.cache.set(tagKey, updated);
            } else {
                await this.cache.delete(tagKey);
            }
        }
    }

    async getKeysForTag(tag: string): Promise<string[]> {
        const tagKey = this.getTagKey(tag);
        const keys = await this.cache.get(tagKey);

        if (isStringArray(keys)) {
            return keys;
        }

        return [];
    }

    async getTagsForKey(key: string): Promise<string[]> {
        const tagMapKey = this.getKeyTagMapKey(key);
        const tags = await this.cache.get(tagMapKey);

        if (isStringArray(tags)) {
            return tags;
        }

        return [];
    }

    async setTagsForKey(key: string, tags: string[]): Promise<void> {
        const tagMapKey = this.getKeyTagMapKey(key);

        // First remove the key from all existing tags
        await this.deleteKeyFromAllTags(key);

        if (tags.length > 0) {
            // Set the key-to-tags mapping
            await this.cache.set(tagMapKey, tags);

            // Add key to each tag's index
            for (const tag of tags) {
                await this.addKeyToTag(key, tag);
            }
        } else {
            // If no tags, remove the mapping
            await this.cache.delete(tagMapKey);
        }
    }

    async deleteTag(tag: string): Promise<void> {
        const tagKey = this.getTagKey(tag);
        const keys = await this.cache.get(tagKey);

        if (isStringArray(keys)) {
            // Remove this tag from all keys' tag mappings
            for (const key of keys) {
                const keyTags = await this.getTagsForKey(key);
                const updatedTags = keyTags.filter((t) => t !== tag);

                if (updatedTags.length > 0) {
                    await this.cache.set(this.getKeyTagMapKey(key), updatedTags);
                } else {
                    await this.cache.delete(this.getKeyTagMapKey(key));
                }
            }
        }

        // Delete the tag index
        await this.cache.delete(tagKey);
    }

    async deleteKeyFromAllTags(key: string): Promise<void> {
        const tagMapKey = this.getKeyTagMapKey(key);
        const tags = await this.cache.get(tagMapKey);

        if (isStringArray(tags)) {
            // Remove key from all tag indexes
            for (const tag of tags) {
                await this.removeKeyFromTag(key, tag);
            }

            // Remove the key-to-tags mapping
            await this.cache.delete(tagMapKey);
        }
    }

    async clear(): Promise<void> {
        await this.cache.clear();
    }

    async compact(tags?: string[]): Promise<void> {
        if (!tags) {
            throw new Error('Global tag compaction not implemented. Please specify tags to compact.');
        }

        for (const tag of tags) {
            await this.compactTag(tag);
        }
    }

    private async compactTag(tag: string): Promise<void> {
        const tagKey = this.getTagKey(tag);
        const existing = await this.cache.get(tagKey);

        if (isStringArray(existing)) {
            // Remove duplicates and verify keys still exist
            const seen = new Set<string>();
            const validKeys: string[] = [];

            for (const key of existing) {
                if (!seen.has(key)) {
                    seen.add(key);
                    // Check if the key still exists in cache
                    const value = await this.cache.get(key);
                    if (value !== undefined) {
                        validKeys.push(key);
                    }
                }
            }

            // Update the tag array if it changed
            if (validKeys.length !== existing.length) {
                if (validKeys.length > 0) {
                    await this.cache.set(tagKey, validKeys);
                } else {
                    await this.cache.delete(tagKey);
                }
            }
        }
    }
}
