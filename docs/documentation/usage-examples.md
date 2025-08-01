---
layout: two-column.liquid
title: Usage & Examples
permalink: /documentation/usage-examples/
---

# Usage & Examples

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