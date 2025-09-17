# tagged-keyv-wrapper

A powerful extension of [@keyvhq/core](https://github.com/jaredwray/keyv) that adds tag-based cache invalidation and management capabilities to the Keyv ecosystem.

## Features

- **🔄 Drop-in replacement** for `@keyvhq/core` with full backward compatibility
- **🏷️ Tag-based invalidation** - Organize cache entries with tags and invalidate them in bulk
- **⚡ Memory efficient** - Automatic compaction and dead key removal
- **🔒 Concurrency safe** - Built-in locking prevents race conditions
- **🧩 Extensible architecture** - Pluggable TagManager interface for different storage backends
- **📝 Full TypeScript support** - Complete type safety with generics

## Installation

```bash
npm install tagged-keyv-wrapper @keyvhq/core
# or
bun add tagged-keyv-wrapper @keyvhq/core
```

## Quick Start

```typescript
import Keyv from '@keyvhq/core';
import { TaggedKeyv } from 'tagged-keyv-wrapper';

// Create a @keyvhq/core instance (any storage adapter works)
const keyv = new Keyv();

// Create TaggedKeyv instance
const cache = new TaggedKeyv(keyv); // Or new TaggedKeyv() for in-memory default

// Use it exactly like @keyvhq/core
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
await cache.getByTag<T>(tag: string, options?: { page?: number; limit?: number }): Promise<Array<[string, T]>>

// Get all unique tags
await cache.getAllTags(): Promise<string[]>

// Get all tags for a specific key
await cache.getTagsForKey(key: string): Promise<string[]>

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

### Tag Introspection and Debugging

```typescript
// Set up some data
await cache.set('user:123', { name: 'Alice', role: 'admin' }, {
  tags: ['users', 'role:admin', 'status:active']
});
await cache.set('session:abc', { userId: 123 }, {
  tags: ['sessions', 'device:web']
});

// Discover all tags in the system
const allTags = await cache.getAllTags();
console.log('All tags:', allTags);
// ['users', 'role:admin', 'status:active', 'sessions', 'device:web']

// Inspect tags for a specific key
const userTags = await cache.getTagsForKey('user:123');
console.log('User tags:', userTags);
// ['users', 'role:admin', 'status:active']

// Conditional operations based on tags
if (userTags.includes('role:admin')) {
  console.log('User has admin privileges');
}

// Debug cache state
for (const tag of allTags) {
  const entries = await cache.getByTag(tag);
  console.log(`Tag "${tag}" has ${entries.length} entries`);
}

// Check if a key has specific tags
const sessionTags = await cache.getTagsForKey('session:abc');
const isWebSession = sessionTags.includes('device:web');
const isMobileSession = sessionTags.includes('device:mobile');
```

## Architecture

TaggedKeyv uses a pluggable architecture with separate concerns:

- **TaggedKeyv** - Main orchestrator class
- **TagManager** - Interface for tag metadata storage
- **KeyvTagManager** - Default implementation using `@keyvhq/core` for tag storage

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

TaggedKeyv is a complete drop-in replacement for `@keyvhq/core`:

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

## Community & Support

We're happy to help with any questions or issues you might have. Here are some ways to get support:

*   **GitHub Issues**: For bug reports and feature requests, please use our [GitHub Issues](https://github.com/angelxmoreno/tagged-keyv-wrapper/issues).
*   **Discord**: Join our community on Discord for general discussion and support: [https://discord.gg/RNDzuJcHTu](https://discord.gg/RNDzuJcHTu)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.