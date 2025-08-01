# Documentation Blueprint

This document contains the necessary content for the documentation website, serving as the single source of truth.

---

## 1. Project Overview & SEO

*   **Project Name:**
    > tagged-keyv-wrapper

*   **One-Sentence Tagline:**
    > A powerful extension of `@keyvhq/core` that adds tag-based cache invalidation and management capabilities.

*   **Site Meta Description:**
    > A powerful extension for @keyvhq/core that adds tag-based cache invalidation, bulk management, and concurrency-safe operations to the Keyv ecosystem.

*   **Canonical URL:**
    > https://tagged-keyv-wrapper.axmdev.app/

*   **SEO Keywords:**
    > keyv, keyvhq, cache, tagging, invalidation, typescript, nodejs, cache-management

## 2. The "Why, What, and Who"

*   **Why was this project built?**
    > `@keyvhq/core` is a great key-value storage library, but it lacks a native way to invalidate multiple keys based on a shared topic or category. This wrapper was built to add robust tagging support for smarter, scoped cache management.

*   **What does it do?**
    > It wraps a `@keyvhq/core` instance, allowing you to associate one or more tags with each cache entry. This enables you to perform bulk operations, such as invalidating or retrieving all entries associated with a specific tag, without affecting the rest of the cache.

*   **Who is this project for?**
    > Developers using the Keyv ecosystem for caching in applications that need smart, targeted invalidation, such as GraphQL APIs, content management systems, or multi-tenant platforms.

## 3. Core Features

*   **List the key features as bullet points:**
    > - **🔄 Drop-in replacement** for `@keyvhq/core` with full backward compatibility
    > - **🏷️ Tag-based invalidation** - Organize cache entries with tags and invalidate them in bulk
    > - **⚡ Memory efficient** - Automatic compaction and dead key removal
    > - **🔒 Concurrency safe** - Built-in locking prevents race conditions
    > - **🧩 Extensible architecture** - Pluggable TagManager interface for different storage backends
    > - **📝 Full TypeScript support** - Complete type safety with generics

## 4. Getting Started

*   **Prerequisites:**
    > Requires a Node.js or Bun environment and a `@keyvhq/core` instance.

*   **Installation Command:**
    > ```bash
    > npm install tagged-keyv-wrapper @keyvhq/core
    > ```

*   **Quick Start Example:**
    > ```typescript
    > import Keyv from '@keyvhq/core';
    > import { TaggedKeyv } from 'tagged-keyv-wrapper';
    >
    > // Create a @keyvhq/core instance (any storage adapter works)
    > const keyv = new Keyv();
    >
    > // Create TaggedKeyv instance
    > const cache = new TaggedKeyv(keyv);
    >
    > // Set a value with tags
    > await cache.set('user:123', { name: 'John' }, {
    >   ttl: 3600,
    >   tags: ['users', 'active']
    > });
    >
    > // Invalidate all users at once
    > await cache.invalidateTag('users');
    > ```

## 5. Usage & Examples

*   **Detailed Use Case 1:**
    > ### Title: User Session Management
    > Description: Manage multiple sessions for a single user and invalidate them all at once upon logout or a security event.
    > ```typescript
    > // Create sessions with tags
    > await cache.set('session:user1:web', { userId: 1, device: 'web' }, {
    >   ttl: 3600,
    >   tags: ['user:1', 'device:web', 'sessions']
    > });
    >
    > await cache.set('session:user1:mobile', { userId: 1, device: 'mobile' }, {
    >   ttl: 3600,
    >   tags: ['user:1', 'device:mobile', 'sessions']
    > });
    >
    > // Invalidate all sessions for user 1
    > await cache.invalidateTag('user:1');
    > ```

*   **Detailed Use Case 2:**
    > ### Title: Product Catalog Caching
    > Description: Cache product data and group it by categories, allowing for efficient invalidation when a category is updated.
    > ```typescript
    > // Add products with category tags
    > await cache.setMany([
    >   ['product:1', { name: 'Laptop', price: 999 }, ['electronics', 'computers']],
    >   ['product:2', { name: 'Phone', price: 699 }, ['electronics', 'mobile']],
    >   ['product:3', { name: 'Shirt', price: 29 }, ['clothing', 'apparel']]
    > ]);
    >
    > // Clear all clothing items from the cache
    > await cache.invalidateTag('clothing');
    > ```

## 6. API Reference

*   **Primary Class/Object:**
    > `TaggedKeyv`

*   **Constructor:**
    > ```typescript
    > new TaggedKeyv(keyv: Keyv, tagManager?: TagManager)
    > ```

*   **Method: `set`**
    > -   **Signature:** `set<T>(key: string, value: T, options?: { ttl?: number; tags?: string[] }): Promise<void>`
    > -   **Description:** Sets a value in the cache with an optional TTL and an array of tags.

*   **Method: `get`**
    > -   **Signature:** `get<T>(key: string): Promise<T | undefined>`
    > -   **Description:** Retrieves a value from the cache by its key.

*   **Method: `delete`**
    > -   **Signature:** `delete(key: string): Promise<boolean>`
    > -   **Description:** Deletes a key and removes its tag associations.

*   **Method: `invalidateTag`**
    > -   **Signature:** `invalidateTag(tag: string): Promise<void>`
    > -   **Description:** Deletes all keys associated with a given tag.

*   **Method: `getByTag`**
    > -   **Signature:** `getByTag<T>(tag: string): Promise<Array<[string, T]>>`
    > -   **Description:** Retrieves all key-value pairs for a given tag.

*   **Method: `clear`**
    > -   **Signature:** `clear(): Promise<void>`
    > -   **Description:** Clears all keys and tag metadata from the cache.

## 7. Community & Support

*   **License:**
    > MIT

*   **Contributing Guide Link:**
    > CONTRIBUTING.md

*   **Code of Conduct Link:**
    > CODE_OF_CONDUCT.md

*   **Where to get help:**
    > [GitHub Issues](https://github.com/angelxmoreno/tagged-keyv-wrapper/issues)
    > [Discord Server](https://discord.gg/RNDzuJcHTu)

*   **Sponsorship Links:**
    > (Your input needed here if applicable)