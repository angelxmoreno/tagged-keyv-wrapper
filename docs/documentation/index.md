---
layout: two-column.liquid
title: Getting started
description: tagged-keyv-wrapper documentation 
canonical: https://tagged-keyv-wrapper.axmdev.app/documentation
---

# Getting Started

## Prerequisites

Requires a Node.js or Bun environment and a `@keyvhq/core` instance.

## Installation

```bash
npm install tagged-keyv-wrapper @keyvhq/core
```

## Quick Start Example

```typescript
import Keyv from '@keyvhq/core';
import { TaggedKeyv } from 'tagged-keyv-wrapper';

// Create a @keyvhq/core instance (any storage adapter works)
const keyv = new Keyv();

// Create TaggedKeyv instance
const cache = new TaggedKeyv(keyv);

// Set a value with tags
await cache.set('user:123', { name: 'John' }, {
  ttl: 3600000, // 1 hour in milliseconds
  tags: ['users', 'active']
});

// Invalidate all users at once
await cache.invalidateTag('users');
```