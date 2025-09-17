---
layout: two-column.liquid
title: API Reference
description: API Reference for tagged-keyv-wrapper
canonical: https://tagged-keyv-wrapper.axmdev.app/api
---

# API Reference

## Primary Class: `TaggedKeyv`

### Constructor

```typescript
new TaggedKeyv(keyv: Keyv, tagManager?: TagManager)
```

### Methods

#### `set`

-   **Signature:** `set<T>(key: string, value: T, options?: { ttl?: number; tags?: string[] }): Promise<void>`
-   **Description:** Sets a value in the cache with an optional TTL (in milliseconds) and an array of tags.
-   **Note:** TTL values are in milliseconds (e.g., `3600000` = 1 hour).

#### `get`

-   **Signature:** `get<T>(key: string): Promise<T | undefined>`
-   **Description:** Retrieves a value from the cache by its key.

#### `delete`

-   **Signature:** `delete(key: string): Promise<boolean>`
-   **Description:** Deletes a key and removes its tag associations.

#### `invalidateTag`

-   **Signature:** `invalidateTag(tag: string): Promise<void>`
-   **Description:** Deletes all keys associated with a given tag.

#### `getByTag`

-   **Signature:** `getByTag<T>(tag: string, options?: { page?: number; limit?: number }): Promise<Array<[string, T]>>`
-   **Description:** Retrieves all key-value pairs for a given tag. Supports pagination with `page` (1-indexed, defaults to 1) and `limit` (defaults to 50).

#### `getAllTags`

-   **Signature:** `getAllTags(): Promise<string[]>`
-   **Description:** Retrieves a list of all unique tags currently in use across the cache.

#### `getTagsForKey`

-   **Signature:** `getTagsForKey(key: string): Promise<string[]>`
-   **Description:** Retrieves all tags associated with a specific key. Useful for introspection, debugging, and conditional operations based on tag presence.

#### `clear`

-   **Signature:** `clear(): Promise<void>`
-   **Description:** Clears all keys and tag metadata from the cache.
