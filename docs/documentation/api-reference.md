---
layout: two-column.liquid
title: API Reference
permalink: /documentation/api-reference/
---

# API Reference

## Primary Class: `TaggedKeyv`

### Constructor

```typescript
new TaggedKeyv(cache?: Keyv, tagManager?: TagManager)
```
- **Description:** Creates a new `TaggedKeyv` instance. If no `cache` (Keyv instance) is provided, it defaults to an in-memory Keyv store.

### Methods

#### `set`

-   **Signature:** `set<T>(key: string, value: T, options?: { ttl?: number; tags?: string[] }): Promise<void>`
-   **Description:** Sets a value in the cache with an optional TTL and an array of tags.

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
-   **Description:** Retrieves key-value pairs associated with a tag. Supports pagination with `page` (1-indexed, defaults to 1) and `limit` (defaults to 50).

#### `getAllTags`

-   **Signature:** `getAllTags(): Promise<string[]>`
-   **Description:** Retrieves a list of all unique tags currently in use across the cache.

#### `clear`

-   **Signature:** `clear(): Promise<void>`
-   **Description:** Clears all keys and tag metadata from the cache.