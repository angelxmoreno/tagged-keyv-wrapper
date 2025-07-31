---
layout: layout.njk
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

-   **Signature:** `getByTag<T>(tag: string): Promise<Array<[string, T]>>`
-   **Description:** Retrieves all key-value pairs for a given tag.

#### `clear`

-   **Signature:** `clear(): Promise<void>`
-   **Description:** Clears all keys and tag metadata from the cache.
