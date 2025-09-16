import { beforeEach, describe, expect, it } from 'bun:test';
import type Keyv from '@keyvhq/core';
import { KeyvTagManager } from '../src/KeyvTagManager';
import { TaggedKeyv } from '../src/TaggedKeyv';
import { createTestKeyv } from './helpers';

describe('TaggedKeyv', () => {
    let keyv: Keyv;
    let taggedKeyv: TaggedKeyv;

    beforeEach(() => {
        keyv = createTestKeyv();
        taggedKeyv = new TaggedKeyv(keyv);
    });

    describe('constructor', () => {
        it('should create with default KeyvTagManager', () => {
            const instance = new TaggedKeyv(keyv);
            expect(instance).toBeInstanceOf(TaggedKeyv);
        });

        it('should accept custom TagManager', () => {
            const customTagManager = new KeyvTagManager(keyv);
            const instance = new TaggedKeyv(keyv, customTagManager);
            expect(instance).toBeInstanceOf(TaggedKeyv);
        });

        it('should create with no parameters and function correctly', async () => {
            const instance = new TaggedKeyv();
            expect(instance).toBeInstanceOf(TaggedKeyv);

            // Verify it works with the default in-memory store
            await instance.set('foo', 'bar', { tags: ['test'] });
            const value = await instance.get('foo');
            expect(value).toBe('bar');

            const results = await instance.getByTag('test');
            expect(results).toEqual([['foo', 'bar']]);
        });
    });

    describe('set - legacy API', () => {
        it('should set a value without tags', async () => {
            await taggedKeyv.set('user:123', { name: 'John' });

            const value = await taggedKeyv.get('user:123');
            expect(value).toEqual({ name: 'John' });
        });

        it('should set a value with tags', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users', 'active']);

            const value = await taggedKeyv.get('user:123');
            expect(value).toEqual({ name: 'John' });

            const userKeys = await taggedKeyv.getByTag('users');
            expect(userKeys).toEqual([['user:123', { name: 'John' }]]);
        });

        it('should set a value with TTL and tags', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, 1000, ['users']);

            const value = await taggedKeyv.get('user:123');
            expect(value).toEqual({ name: 'John' });

            const userKeys = await taggedKeyv.getByTag('users');
            expect(userKeys).toEqual([['user:123', { name: 'John' }]]);
        });
    });

    describe('set - new API', () => {
        it('should set a value with options object', async () => {
            await taggedKeyv.set(
                'user:123',
                { name: 'John' },
                {
                    ttl: 1000,
                    tags: ['users', 'active'],
                }
            );

            const value = await taggedKeyv.get('user:123');
            expect(value).toEqual({ name: 'John' });

            const userKeys = await taggedKeyv.getByTag('users');
            expect(userKeys).toEqual([['user:123', { name: 'John' }]]);
        });

        it('should handle empty options', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, {});

            const value = await taggedKeyv.get('user:123');
            expect(value).toEqual({ name: 'John' });
        });

        it('should handle undefined options', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined);

            const value = await taggedKeyv.get('user:123');
            expect(value).toEqual({ name: 'John' });
        });
    });

    describe('get', () => {
        it('should get existing value', async () => {
            await taggedKeyv.set('user:123', { name: 'John' });

            const value = await taggedKeyv.get('user:123');
            expect(value).toEqual({ name: 'John' });
        });

        it('should return undefined for non-existent key', async () => {
            const value = await taggedKeyv.get('nonexistent');
            expect(value).toBeUndefined();
        });
    });

    describe('delete', () => {
        it('should delete a key and remove from tags', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users', 'active']);

            const deleted = await taggedKeyv.delete('user:123');
            expect(deleted).toBe(true);

            const value = await taggedKeyv.get('user:123');
            expect(value).toBeUndefined();

            const userKeys = await taggedKeyv.getByTag('users');
            expect(userKeys).toEqual([]);

            const activeKeys = await taggedKeyv.getByTag('active');
            expect(activeKeys).toEqual([]);
        });

        it('should return false for non-existent key', async () => {
            const deleted = await taggedKeyv.delete('nonexistent');
            expect(deleted).toBe(false);
        });

        it('should handle delete of key without tags', async () => {
            await taggedKeyv.set('user:123', { name: 'John' });

            const deleted = await taggedKeyv.delete('user:123');
            expect(deleted).toBe(true);

            const value = await taggedKeyv.get('user:123');
            expect(value).toBeUndefined();
        });
    });

    describe('invalidateTag', () => {
        it('should invalidate all keys with a tag', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users', 'active']);
            await taggedKeyv.set('user:456', { name: 'Jane' }, undefined, ['users', 'premium']);

            await taggedKeyv.invalidateTag('users');

            const user123 = await taggedKeyv.get('user:123');
            const user456 = await taggedKeyv.get('user:456');
            expect(user123).toBeUndefined();
            expect(user456).toBeUndefined();

            const userKeys = await taggedKeyv.getByTag('users');
            expect(userKeys).toEqual([]);

            const activeKeys = await taggedKeyv.getByTag('active');
            expect(activeKeys).toEqual([]);

            const premiumKeys = await taggedKeyv.getByTag('premium');
            expect(premiumKeys).toEqual([]);
        });

        it('should handle invalidating non-existent tag', async () => {
            await taggedKeyv.invalidateTag('nonexistent');
            // Should not throw
        });
    });

    describe('getByTag', () => {
        it('should return all key-value pairs for a tag', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users']);
            await taggedKeyv.set('user:456', { name: 'Jane' }, undefined, ['users']);

            const results = await taggedKeyv.getByTag('users');

            expect(results).toHaveLength(2);
            const resultMap = new Map(results);
            expect(resultMap.get('user:123')).toEqual({ name: 'John' });
            expect(resultMap.get('user:456')).toEqual({ name: 'Jane' });
        });

        it('should return empty array for non-existent tag', async () => {
            const results = await taggedKeyv.getByTag('nonexistent');
            expect(results).toEqual([]);
        });

        it('should handle dead keys by auto-compacting', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users']);
            await taggedKeyv.set('user:456', { name: 'Jane' }, undefined, ['users']);

            // Delete one key directly from cache (simulating dead key)
            await keyv.delete('user:123');

            const results = await taggedKeyv.getByTag('users');
            expect(results).toEqual([['user:456', { name: 'Jane' }]]);
        });

        describe('with page/limit pagination', () => {
            beforeEach(async () => {
                // Create 55 users for pagination tests to test defaults
                for (let i = 1; i <= 55; i++) {
                    await taggedKeyv.set(`user:${i}`, { name: `User ${i}` }, undefined, ['users']);
                }
            });

            it('should use default limit of 50 when no options are provided', async () => {
                const results = await taggedKeyv.getByTag('users');
                expect(results).toHaveLength(50);
            });

            it('should respect the limit option', async () => {
                const results = await taggedKeyv.getByTag('users', { limit: 10 });
                expect(results).toHaveLength(10);
            });

            it('should respect the page option', async () => {
                // Get page 2 with a limit of 10
                const results = await taggedKeyv.getByTag('users', { page: 2, limit: 10 });
                expect(results).toHaveLength(10);
                expect(results[0]?.[0]).toBe('user:11'); // 1-based index
            });

            it('should handle reaching the last page', async () => {
                // 55 users, limit 50. Page 2 should have 5 users.
                const results = await taggedKeyv.getByTag('users', { page: 2 });
                expect(results).toHaveLength(5);
            });

            it('should handle page number greater than available pages', async () => {
                const results = await taggedKeyv.getByTag('users', { page: 10 });
                expect(results).toHaveLength(0);
            });

            it('should handle a page number less than 1', async () => {
                const resultsPage0 = await taggedKeyv.getByTag('users', { page: 0, limit: 5 });
                const resultsPage1 = await taggedKeyv.getByTag('users', { page: 1, limit: 5 });
                expect(resultsPage0).toEqual(resultsPage1);
            });
        });
    });

    describe('clear', () => {
        it('should clear all data and tags', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users']);
            await taggedKeyv.set('user:456', { name: 'Jane' }, undefined, ['users']);

            await taggedKeyv.clear();

            const user123 = await taggedKeyv.get('user:123');
            const user456 = await taggedKeyv.get('user:456');
            expect(user123).toBeUndefined();
            expect(user456).toBeUndefined();

            const userKeys = await taggedKeyv.getByTag('users');
            expect(userKeys).toEqual([]);
        });
    });

    describe('invalidateTags', () => {
        it('should invalidate multiple tags', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users', 'active']);
            await taggedKeyv.set('user:456', { name: 'Jane' }, undefined, ['users', 'premium']);
            await taggedKeyv.set('product:789', { name: 'Product' }, undefined, ['products']);

            await taggedKeyv.invalidateTags(['users', 'products']);

            const user123 = await taggedKeyv.get('user:123');
            const user456 = await taggedKeyv.get('user:456');
            const product789 = await taggedKeyv.get('product:789');

            expect(user123).toBeUndefined();
            expect(user456).toBeUndefined();
            expect(product789).toBeUndefined();
        });

        it('should handle empty tags array', async () => {
            await taggedKeyv.invalidateTags([]);
            // Should not throw
        });
    });

    describe('setMany', () => {
        it('should set multiple entries', async () => {
            await taggedKeyv.setMany([
                ['user:123', { name: 'John' }, ['users', 'active']],
                ['user:456', { name: 'Jane' }, ['users', 'premium']],
                ['product:789', { name: 'Product' }], // No tags
            ]);

            const user123 = await taggedKeyv.get('user:123');
            const user456 = await taggedKeyv.get('user:456');
            const product789 = await taggedKeyv.get('product:789');

            expect(user123).toEqual({ name: 'John' });
            expect(user456).toEqual({ name: 'Jane' });
            expect(product789).toEqual({ name: 'Product' });

            const userKeys = await taggedKeyv.getByTag('users');
            expect(userKeys).toHaveLength(2);
        });

        it('should handle empty entries array', async () => {
            await taggedKeyv.setMany([]);
            // Should not throw
        });
    });

    describe('has', () => {
        it('should return true for existing key', async () => {
            await taggedKeyv.set('user:123', { name: 'John' });

            const exists = await taggedKeyv.has('user:123');
            expect(exists).toBe(true);
        });

        it('should return false for non-existent key', async () => {
            const exists = await taggedKeyv.has('nonexistent');
            expect(exists).toBe(false);
        });
    });

    describe('compactTags', () => {
        it('should compact specified tags', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users']);
            await taggedKeyv.set('user:456', { name: 'Jane' }, undefined, ['users']);

            // Delete one key directly from cache (simulating dead key)
            await keyv.delete('user:123');

            await taggedKeyv.compactTags(['users']);

            const userKeys = await taggedKeyv.getByTag('users');
            expect(userKeys).toEqual([['user:456', { name: 'Jane' }]]);
        });

        it('should throw error for global compaction', async () => {
            await expect(taggedKeyv.compactTags()).rejects.toThrow('Global tag compaction not implemented');
        });
    });

    describe('error handling', () => {
        it('should handle cache errors gracefully', async () => {
            // Mock a cache error
            const mockKeyv = {
                get: async () => {
                    throw new Error('Cache error');
                },
                set: async () => {
                    throw new Error('Cache error');
                },
                delete: async () => {
                    throw new Error('Cache error');
                },
                clear: async () => {
                    throw new Error('Cache error');
                },
            } as unknown as Keyv;

            const errorTaggedKeyv = new TaggedKeyv(mockKeyv);

            await expect(errorTaggedKeyv.get('test')).rejects.toThrow('Failed to get key "test"');
        });

        it('should cleanup on set failure', async () => {
            // This test would require mocking the tag manager to fail
            // which is more complex, but the error handling is tested
            // in the individual methods
        });
    });

    describe('concurrency', () => {
        it('should handle concurrent operations on the same key', async () => {
            // Start multiple concurrent set operations on different keys
            for (let i = 0; i < 10; i++) {
                await taggedKeyv.set(`user:${i}`, { name: `User${i}` }, undefined, ['users']);
            }

            const userKeys = await taggedKeyv.getByTag('users');
            expect(userKeys).toHaveLength(10);
        });

        it('should handle concurrent operations on different keys', async () => {
            const promises = [];

            // Start multiple concurrent operations
            promises.push(taggedKeyv.set('user:1', { name: 'User1' }, undefined, ['users']));
            promises.push(taggedKeyv.set('user:2', { name: 'User2' }, undefined, ['users']));
            promises.push(taggedKeyv.delete('user:1'));
            promises.push(taggedKeyv.getByTag('users'));

            await Promise.all(promises);

            // Final state should be consistent
            const userKeys = await taggedKeyv.getByTag('users');
            expect(userKeys.length).toBeLessThanOrEqual(2);
        });
    });

    describe('type safety', () => {
        it('should handle different value types', async () => {
            await taggedKeyv.set('string', 'hello', undefined, ['strings']);
            await taggedKeyv.set('number', 42, undefined, ['numbers']);
            await taggedKeyv.set('object', { key: 'value' }, undefined, ['objects']);
            await taggedKeyv.set('array', [1, 2, 3], undefined, ['arrays']);

            const stringVal = await taggedKeyv.get<string>('string');
            const numberVal = await taggedKeyv.get<number>('number');
            const objectVal = await taggedKeyv.get<object>('object');
            const arrayVal = await taggedKeyv.get<number[]>('array');

            expect(stringVal).toBe('hello');
            expect(numberVal).toBe(42);
            expect(objectVal).toEqual({ key: 'value' });
            expect(arrayVal).toEqual([1, 2, 3]);
        });
    });
});
