---
layout: two-column.liquid
title: Usage & Examples
permalink: /documentation/usage-examples/
---

# Usage & Examples

## Basic Initialization (Issue #4)

`TaggedKeyv` can be initialized with or without a `Keyv` instance. If no `Keyv` instance is provided, it defaults to an in-memory store.

```typescript
import { TaggedKeyv } from 'tagged-keyv-wrapper';
import Keyv from '@keyvhq/core';
import KeyvRedis from '@keyvhq/redis'; // Import the Redis adapter

// Using a custom Keyv instance (e.g., Redis, Memcached)
const redisStore = new KeyvRedis('redis://user:pass@localhost:6379');
const redisKeyv = new Keyv({ store: redisStore });
const cacheWithRedis = new TaggedKeyv(redisKeyv);

// Using the default in-memory Keyv store
const inMemoryCache = new TaggedKeyv();

// Example usage
await inMemoryCache.set('greeting', 'Hello, World!');
const greeting = await inMemoryCache.get('greeting');
console.log(greeting); // Output: Hello, World!
```

## User Session Management

Manage multiple sessions for a single user and invalidate them all at once upon logout or a security event.

```typescript
// Create sessions with tags
await cache.set('session:user1:web', { userId: 1, device: 'web' }, {
  ttl: 3600,
  tags: ['user:1', 'device:web', 'sessions']
});

await cache.set('session:user1:mobile', { userId: 1, device: 'mobile' }, {
  ttl: 3600,
  tags: ['user:1', 'device:mobile', 'sessions']
});

// Invalidate all sessions for user 1
await cache.invalidateTag('user:1');
```

## Product Catalog Caching

Cache product data and group it by categories, allowing for efficient invalidation when a category is updated.

```typescript
// Add products with category tags
await cache.setMany([
  ['product:1', { name: 'Laptop', price: 999 }, ['electronics', 'computers']],
  ['product:2', { name: 'Phone', price: 699 }, ['electronics', 'mobile']],
  ['product:3', { name: 'Shirt', price: 29 }, ['clothing', 'apparel']]
]);

// Clear all clothing items from the cache
await cache.invalidateTag('clothing');
```

## Listing All Tags (Issue #5)

Retrieve a list of all unique tags currently in use across the cache.

```typescript
// Assuming some keys have been set with tags
await cache.set('item:1', 'data1', { tags: ['tagA', 'tagB'] });
await cache.set('item:2', 'data2', { tags: ['tagB', 'tagC'] });

const allActiveTags = await cache.getAllTags();
console.log(allActiveTags); // Output: ['tagA', 'tagB', 'tagC'] (order may vary)
```

## Paginated Tag Retrieval (Issue #6)

Retrieve key-value pairs associated with a tag using `page` and `limit` for efficient pagination.

```typescript
// Populate cache with many items for a tag
for (let i = 1; i <= 105; i++) {
  await cache.set(`user:${i}`, { name: `User ${i}` }, { tags: ['users'] });
}

// Get the first page (default limit is 50)
const firstPageUsers = await cache.getByTag('users', { page: 1 });
console.log(`First page has ${firstPageUsers.length} users.`); // Output: First page has 50 users.

// Get the second page with a custom limit
const secondPageUsers = await cache.getByTag('users', { page: 2, limit: 25 });
console.log(`Second page has ${secondPageUsers.length} users.`); // Output: Second page has 25 users.
console.log(secondPageUsers[0]); // Output: ['user:26', { name: 'User 26' }]

// Get the last page (page 3 with limit 25, or page 3 with default limit 50)
const lastPageUsers = await cache.getByTag('users', { page: 3, limit: 50 });
console.log(`Last page has ${lastPageUsers.length} users.`); // Output: Last page has 5 users.
```