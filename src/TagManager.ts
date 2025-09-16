/**
 * Interface for managing tag metadata storage
 */
export interface TagManager {
    /**
     * Add a key to a specific tag
     */
    addKeyToTag(key: string, tag: string): Promise<void>;

    /**
     * Remove a key from a specific tag
     */
    removeKeyFromTag(key: string, tag: string): Promise<void>;

    /**
     * Get all keys associated with a tag
     */
    getKeysForTag(tag: string): Promise<string[]>;

    /**
     * Get all tags associated with a key
     */
    getTagsForKey(key: string): Promise<string[]>;

    /**
     * Set the tags for a key (replaces existing tags)
     */
    setTagsForKey(key: string, tags: string[]): Promise<void>;

    /**
     * Delete a tag and all its associations
     */
    deleteTag(tag: string): Promise<void>;

    /**
     * Remove a key from all tags it belongs to
     */
    deleteKeyFromAllTags(key: string): Promise<void>;

    /**
     * Clear all tag metadata
     */
    clear(): Promise<void>;

    /**
     * Compact/optimize tag storage (implementation-specific)
     */
    compact(tags?: string[]): Promise<void>;

    /**
     * Get all unique tags currently stored.
     */
    getAllTags(): Promise<string[]>;
}
