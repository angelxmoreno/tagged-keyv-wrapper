---
layout: layout.njk
title: tagged-keyv-wrapper
description: A powerful extension for @keyvhq/core that adds tag-based cache invalidation, bulk management, and concurrency-safe operations to the Keyv ecosystem.
canonical: https://tagged-keyv-wrapper.axmdev.app/
---

# tagged-keyv-wrapper

## 🙋 Why this was built

@keyvhq/core is a great key-value storage library, but it lacks a native way to invalidate multiple keys based on a shared topic or category. This wrapper was built to add robust tagging support for smarter, scoped cache management.

## 💡 What it does

It wraps a `@keyvhq/core` instance, allowing you to associate one or more tags with each cache entry. This enables you to perform bulk operations, such as invalidating or retrieving all entries associated with a specific tag, without affecting the rest of the cache.

## 👤 Who it's for

Developers using the Keyv ecosystem for caching in applications that need smart, targeted invalidation, such as GraphQL APIs, content management systems, or multi-tenant platforms.

## ✨ Core Features

- **🔄 Drop-in replacement** for `@keyvhq/core` with full backward compatibility
- **🏷️ Tag-based invalidation** - Organize cache entries with tags and invalidate them in bulk
- **⚡ Memory efficient** - Automatic compaction and dead key removal
- **🔒 Concurrency safe** - Built-in locking prevents race conditions
- **🧩 Extensible architecture** - Pluggable TagManager interface for different storage backends
- **📝 Full TypeScript support** - Complete type safety with generics

## 🚀 Getting Started

### Prerequisites

Requires a Node.js or Bun environment and a `@keyvhq/core` instance.

### Installation

```bash
npm install tagged-keyv-wrapper @keyvhq/core
```

### Quick Start Example

```typescript
import Keyv from '@keyvhq/core';
import { TaggedKeyv } from 'tagged-keyv-wrapper';

// Create a @keyvhq/core instance (any storage adapter works)
const keyv = new Keyv();

// Create TaggedKeyv instance
const cache = new TaggedKeyv(keyv);

// Set a value with tags
await cache.set('user:123', { name: 'John' }, {
  ttl: 3600,
  tags: ['users', 'active']
});

// Invalidate all users at once
await cache.invalidateTag('users');
```

## 📚 Usage & Examples

### User Session Management

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

### Product Catalog Caching

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

## 🤝 Community & Support

We're happy to help with any questions or issues you might have. Here are some ways to get support:

*   **GitHub Issues**: For bug reports and feature requests, please use our [GitHub Issues](https://github.com/angelxmoreno/tagged-keyv-wrapper/issues).
*   **Discord**: Join our community on Discord for general discussion and support: [https://discord.gg/RNDzuJcHTu](https://discord.gg/RNDzuJcHTu)
*   **License**: This project is licensed under the [MIT License](LICENSE).
*   **Contributing**: Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.
*   **Code of Conduct**: Please read our [Code of Conduct](CODE_OF_CONDUCT.md).