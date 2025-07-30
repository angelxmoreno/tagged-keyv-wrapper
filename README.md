# tagged-keyv-wrapper

A powerful extension of [Keyv](https://github.com/jaredwray/keyv) that adds tag-based cache invalidation and management capabilities.

## Features

- **🔄 Drop-in replacement** for Keyv with full backward compatibility
- **🏷️ Tag-based invalidation** - Organize cache entries with tags and invalidate them in bulk
- **⚡ Memory efficient** - Automatic compaction and dead key removal
- **🔒 Concurrency safe** - Built-in locking prevents race conditions
- **🧩 Extensible architecture** - Pluggable TagManager interface for different storage backends
- **📝 Full TypeScript support** - Complete type safety with generics

## Installation

```bash
bun add @keyvhq/core
# This package is currently local to the monorepo
```

## Quick Start

```typescript
import Keyv from '@keyvhq/core';
import { TaggedKeyv } from 'tagged-keyv-wrapper';

// Create a Keyv instance (any storage adapter works)
const keyv = new Keyv();

// Create TaggedKeyv instance
const cache = new TaggedKeyv(keyv);

// Use it exactly like Keyv
await cache.set('user:123', { name: 'John' });
const user = await cache.get('user:123');

// PLUS tag functionality
await cache.set('user:123', { name: 'John' }, { 
  ttl: 3600, 
  tags: ['users', 'active'] 
});

// Invalidate all users at once
await cache.invalidateTag('users');
```

## API Reference

### Core Methods (Keyv Compatible)

```typescript
// Set a value (backward compatible)
await cache.set(key: string, value: T, ttl?: number): Promise<void>

// Set a value with tags (new API)
await cache.set(key: string, value: T, options?: { 
  ttl?: number, 
  tags?: string[] 
}): Promise<void>

// Get a value
await cache.get<T>(key: string): Promise<T | undefined>

// Delete a key
await cache.delete(key: string): Promise<boolean>

// Check if key exists
await cache.has(key: string): Promise<boolean>

// Clear all data
await cache.clear(): Promise<void>
```

### Tag Management

```typescript
// Get all entries with a specific tag
await cache.getByTag<T>(tag: string): Promise<Array<[string, T]>>

// Invalidate all entries with a tag
await cache.invalidateTag(tag: string): Promise<void>

// Invalidate multiple tags
await cache.invalidateTags(tags: string[]): Promise<void>

// Bulk set operations
await cache.setMany(entries: Array<[string, T, string[]?]>): Promise<void>

// Compact tag arrays (remove dead keys)
await cache.compactTags(tags?: string[]): Promise<void>
```

## Usage Examples

### User Session Management

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

// Get all web sessions
const webSessions = await cache.getByTag('device:web');
```

### Product Catalog

```typescript
// Add products with category tags
await cache.setMany([
  ['product:1', { name: 'Laptop', price: 999 }, ['electronics', 'computers']],
  ['product:2', { name: 'Phone', price: 699 }, ['electronics', 'mobile']],
  ['product:3', { name: 'Shirt', price: 29 }, ['clothing', 'apparel']]
]);

// Get all electronics
const electronics = await cache.getByTag('electronics');

// Clear all clothing items
await cache.invalidateTag('clothing');
```

### Cache Warming

```typescript
// Warm cache with frequently accessed data
const users = await database.getActiveUsers();
for (const user of users) {
  await cache.set(`user:${user.id}`, user, { 
    ttl: 1800, 
    tags: ['users', 'warmed', `role:${user.role}`] 
  });
}

// Clear warmed cache
await cache.invalidateTag('warmed');
```

## Architecture

TaggedKeyv uses a pluggable architecture with separate concerns:

- **TaggedKeyv** - Main orchestrator class
- **TagManager** - Interface for tag metadata storage
- **KeyvTagManager** - Default implementation using Keyv for tag storage

### Custom TagManager

```typescript
import { TagManager } from 'tagged-keyv-wrapper';

class CustomTagManager implements TagManager {
  // Implement interface methods
  async addKeyToTag(key: string, tag: string): Promise<void> { /* ... */ }
  async removeKeyFromTag(key: string, tag: string): Promise<void> { /* ... */ }
  // ... other methods
}

// Use custom implementation
const cache = new TaggedKeyv(keyv, new CustomTagManager());
```

## Development

### Running Tests

```bash
bun test                # Run all tests
bun test --watch        # Watch mode
bun test --coverage     # With coverage
```

### Building

```bash
bun run build          # Build TypeScript
bun run check-types     # Type checking
bun run dev            # Watch mode
```

## Performance Considerations

- **Memory efficiency**: Automatic compaction removes dead keys and duplicates
- **Concurrency**: Built-in locking prevents race conditions on key operations
- **Bulk operations**: Use `setMany()` and `invalidateTags()` for better performance
- **Tag cleanup**: Call `compactTags()` periodically for optimal memory usage

## Migration from Keyv

TaggedKeyv is a complete drop-in replacement for Keyv:

```typescript
// Before
const keyv = new Keyv();
await keyv.set('key', 'value', 3600);

// After (no changes needed)
const cache = new TaggedKeyv(keyv);
await cache.set('key', 'value', 3600);

// Plus new functionality
await cache.set('key', 'value', { ttl: 3600, tags: ['tag1'] });
```

## License

MIT