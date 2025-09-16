import { beforeEach, describe, expect, it } from 'bun:test';
import type Keyv from '@keyvhq/core';
import { KeyvTagManager, TaggedKeyv } from '../src';
import { createTestKeyv } from './helpers';

describe('Integration Tests', () => {
    let keyv: Keyv;
    let taggedKeyv: TaggedKeyv;

    beforeEach(() => {
        keyv = createTestKeyv();
        taggedKeyv = new TaggedKeyv(keyv);
    });

    describe('Real-world usage scenarios', () => {
        it('should handle user session management', async () => {
            // Create user sessions with different tags
            await taggedKeyv.set(
                'session:user1:web',
                { userId: 1, device: 'web' },
                {
                    ttl: 3600,
                    tags: ['user:1', 'device:web', 'sessions'],
                }
            );

            await taggedKeyv.set(
                'session:user1:mobile',
                { userId: 1, device: 'mobile' },
                {
                    ttl: 3600,
                    tags: ['user:1', 'device:mobile', 'sessions'],
                }
            );

            await taggedKeyv.set(
                'session:user2:web',
                { userId: 2, device: 'web' },
                {
                    ttl: 3600,
                    tags: ['user:2', 'device:web', 'sessions'],
                }
            );

            // Get all sessions for user 1
            const user1Sessions = await taggedKeyv.getByTag('user:1');
            expect(user1Sessions).toHaveLength(2);

            // Get all web sessions
            const webSessions = await taggedKeyv.getByTag('device:web');
            expect(webSessions).toHaveLength(2);

            // Invalidate all sessions for user 1
            await taggedKeyv.invalidateTag('user:1');

            // Verify user 1 sessions are gone
            const remainingSessions = await taggedKeyv.getByTag('sessions');
            expect(remainingSessions).toHaveLength(1);
            expect(remainingSessions[0]?.[0]).toBe('session:user2:web');
        });

        it('should handle product catalog with categories', async () => {
            // Add products with category tags
            await taggedKeyv.setMany([
                ['product:1', { name: 'Laptop', price: 999 }, ['category:electronics', 'brand:apple', 'products']],
                ['product:2', { name: 'Phone', price: 699 }, ['category:electronics', 'brand:apple', 'products']],
                ['product:3', { name: 'Shirt', price: 29 }, ['category:clothing', 'brand:nike', 'products']],
                ['product:4', { name: 'Shoes', price: 149 }, ['category:clothing', 'brand:nike', 'products']],
            ]);

            // Get all electronics
            const electronics = await taggedKeyv.getByTag('category:electronics');
            expect(electronics).toHaveLength(2);

            // Get all Apple products
            const appleProducts = await taggedKeyv.getByTag('brand:apple');
            expect(appleProducts).toHaveLength(2);

            // Clear all clothing items
            await taggedKeyv.invalidateTag('category:clothing');

            // Verify only electronics remain
            const remainingProducts = await taggedKeyv.getByTag<{ name: string; price: number }>('products');
            expect(remainingProducts).toHaveLength(2);
            expect(
                remainingProducts.every(([_, product]) => product.name === 'Laptop' || product.name === 'Phone')
            ).toBe(true);
        });

        it('should handle cache warming and preloading', async () => {
            // Simulate cache warming for frequently accessed data
            const userData = [
                { id: 1, name: 'John', role: 'admin' },
                { id: 2, name: 'Jane', role: 'user' },
                { id: 3, name: 'Bob', role: 'user' },
            ];

            // Warm cache with user data
            for (const user of userData) {
                await taggedKeyv.set(`user:${user.id}`, user, {
                    ttl: 1800,
                    tags: ['users', `role:${user.role}`, 'warmed'],
                });
            }

            // Verify cache is warmed
            const allUsers = await taggedKeyv.getByTag('users');
            expect(allUsers).toHaveLength(3);

            // Get admin users
            const adminUsers = await taggedKeyv.getByTag<{ id: number; name: string; role: string }>('role:admin');
            expect(adminUsers).toHaveLength(1);
            expect(adminUsers[0]?.[1].name).toBe('John');

            // Clear warmed cache
            await taggedKeyv.invalidateTag('warmed');

            // Verify cache is cleared
            const remainingUsers = await taggedKeyv.getByTag('users');
            expect(remainingUsers).toHaveLength(0);
        });
    });

    describe('Performance and memory efficiency', () => {
        it('should handle large numbers of keys efficiently', async () => {
            const numKeys = 100; // Reduced for faster testing

            // Add many keys with tags sequentially to avoid race conditions
            for (let i = 0; i < numKeys; i++) {
                await taggedKeyv.set(`key:${i}`, { value: i }, undefined, [
                    'all',
                    i % 2 === 0 ? 'even' : 'odd',
                    `group:${Math.floor(i / 10)}`,
                ]);
            }

            // Verify all keys are accessible
            const allKeys = await taggedKeyv.getByTag('all', { limit: numKeys });
            expect(allKeys).toHaveLength(numKeys);

            // Verify even/odd distribution
            const evenKeys = await taggedKeyv.getByTag('even', { limit: numKeys });
            const oddKeys = await taggedKeyv.getByTag('odd', { limit: numKeys });
            expect(evenKeys.length).toBe(numKeys / 2);
            expect(oddKeys.length).toBe(numKeys / 2);

            // Test group operations
            const group0 = await taggedKeyv.getByTag('group:0');
            expect(group0).toHaveLength(10);
        });

        it('should handle tag compaction correctly', async () => {
            // Create some data
            await taggedKeyv.set('key1', 'value1', undefined, ['test']);
            await taggedKeyv.set('key2', 'value2', undefined, ['test']);
            await taggedKeyv.set('key3', 'value3', undefined, ['test']);

            // Manually delete some keys from cache (simulating dead keys)
            await keyv.delete('key1');
            await keyv.delete('key3');

            // Compact should remove dead keys
            await taggedKeyv.compactTags(['test']);

            // Verify only live keys remain
            const testKeys = await taggedKeyv.getByTag('test');
            expect(testKeys).toHaveLength(1);
            expect(testKeys[0]?.[0]).toBe('key2');
        });
    });

    describe('Error resilience', () => {
        it('should handle partial failures gracefully', async () => {
            // Set up some data
            await taggedKeyv.set('key1', 'value1', undefined, ['tag1', 'tag2']);
            await taggedKeyv.set('key2', 'value2', undefined, ['tag1', 'tag3']);

            // Simulate partial failure during bulk operation
            const results = await Promise.allSettled([
                taggedKeyv.invalidateTag('tag1'),
                taggedKeyv.invalidateTag('nonexistent'),
                taggedKeyv.get('key1'),
            ]);

            // Should handle the operations without throwing
            expect(results[0].status).toBe('fulfilled');
            expect(results[1].status).toBe('fulfilled');
            expect(results[2].status).toBe('fulfilled');
        });

        it('should maintain consistency during concurrent operations', async () => {
            const promises = [];

            // Start multiple concurrent operations on different keys
            for (let i = 0; i < 10; i++) {
                promises.push(taggedKeyv.set(`key:${i}`, { value: i }, undefined, [`tag:${i}`]));
            }

            await Promise.all(promises);

            // All keys should exist with their values
            for (let i = 0; i < 10; i++) {
                const value = await taggedKeyv.get<{ value: number }>(`key:${i}`);
                expect(value).toBeDefined();
                expect(value?.value).toBe(i);
            }

            // Each key should be associated with exactly one tag
            for (let i = 0; i < 10; i++) {
                const keys = await taggedKeyv.getByTag(`tag:${i}`);
                expect(keys.length).toBe(1);
                expect(keys[0]?.[0]).toBe(`key:${i}`);
            }
        });
    });

    describe('Custom TagManager integration', () => {
        it('should work with custom TagManager implementation', async () => {
            // Create a custom TagManager that uses the same Keyv instance
            const customTagManager = new KeyvTagManager(keyv);
            const customTaggedKeyv = new TaggedKeyv(keyv, customTagManager);

            // Use the custom instance
            await customTaggedKeyv.set('test:key', 'test:value', undefined, ['custom']);

            // Verify it works
            const value = await customTaggedKeyv.get('test:key');
            expect(value).toBe('test:value');

            const tagged = await customTaggedKeyv.getByTag('custom');
            expect(tagged).toHaveLength(1);
            expect(tagged[0]).toEqual(['test:key', 'test:value']);
        });

        it('should isolate tag managers when using different instances', async () => {
            const keyv2 = createTestKeyv();
            const taggedKeyv2 = new TaggedKeyv(keyv2);

            // Set data in both instances
            await taggedKeyv.set('key1', 'value1', undefined, ['shared']);
            await taggedKeyv2.set('key2', 'value2', undefined, ['shared']);

            // They should be isolated
            const keys1 = await taggedKeyv.getByTag('shared');
            const keys2 = await taggedKeyv2.getByTag('shared');

            expect(keys1).toHaveLength(1);
            expect(keys2).toHaveLength(1);
            expect(keys1[0]?.[0]).toBe('key1');
            expect(keys2[0]?.[0]).toBe('key2');
        });
    });

    describe('API compatibility', () => {
        it('should maintain Keyv API compatibility', async () => {
            // All these should work as drop-in replacements
            await taggedKeyv.set('key1', 'value1');
            await taggedKeyv.set('key2', 'value2', 1000);

            const value1 = await taggedKeyv.get('key1');
            const value2 = await taggedKeyv.get('key2');

            expect(value1).toBe('value1');
            expect(value2).toBe('value2');

            const exists = await taggedKeyv.has('key1');
            expect(exists).toBe(true);

            const deleted = await taggedKeyv.delete('key1');
            expect(deleted).toBe(true);

            await taggedKeyv.clear();

            const clearedValue = await taggedKeyv.get('key2');
            expect(clearedValue).toBeUndefined();
        });

        it('should support both old and new API styles', async () => {
            // Old style
            await taggedKeyv.set('old:key', 'old:value', 1000, ['old']);

            // New style
            await taggedKeyv.set('new:key', 'new:value', { ttl: 1000, tags: ['new'] });

            // Both should work
            const oldValue = await taggedKeyv.get('old:key');
            const newValue = await taggedKeyv.get('new:key');

            expect(oldValue).toBe('old:value');
            expect(newValue).toBe('new:value');

            const oldTagged = await taggedKeyv.getByTag('old');
            const newTagged = await taggedKeyv.getByTag('new');

            expect(oldTagged).toHaveLength(1);
            expect(newTagged).toHaveLength(1);
        });
    });
});
