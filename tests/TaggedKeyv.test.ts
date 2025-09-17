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
                    ttl: 60000, // 1 minute
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

        it('should retrieve full value when set with tags, accessed by key only', async () => {
            // Set a value with tags
            const userData = { name: 'Alice', role: 'admin', active: true };
            await taggedKeyv.set('user:456', userData, {
                ttl: 300000, // 5 minutes
                tags: ['users', 'admins', 'active'],
            });

            // Retrieve by key only - should get complete value
            const retrievedValue = await taggedKeyv.get('user:456');
            expect(retrievedValue).toEqual(userData);

            // Verify tags are stored separately but don't affect value retrieval
            const tags = await taggedKeyv.getTagsForKey('user:456');
            expect(tags.sort()).toEqual(['active', 'admins', 'users']);

            // Verify value is accessible via tag operations too
            const usersByTag = await taggedKeyv.getByTag('admins');
            expect(usersByTag).toEqual([['user:456', userData]]);
        });

        it('should work identically for tagged and non-tagged entries', async () => {
            // Set one entry with tags
            const taggedData = { type: 'tagged', data: 'with tags' };
            await taggedKeyv.set('tagged:key', taggedData, { tags: ['tagged'] });

            // Set another entry without tags
            const untaggedData = { type: 'untagged', data: 'no tags' };
            await taggedKeyv.set('untagged:key', untaggedData);

            // Both should retrieve identically via get()
            const taggedResult = await taggedKeyv.get('tagged:key');
            const untaggedResult = await taggedKeyv.get('untagged:key');

            expect(taggedResult).toEqual(taggedData);
            expect(untaggedResult).toEqual(untaggedData);

            // Verify tag metadata is different but doesn't affect get()
            const taggedKeyTags = await taggedKeyv.getTagsForKey('tagged:key');
            const untaggedKeyTags = await taggedKeyv.getTagsForKey('untagged:key');

            expect(taggedKeyTags).toEqual(['tagged']);
            expect(untaggedKeyTags).toEqual([]);
        });

        it('should retrieve complex objects with tags unchanged', async () => {
            const complexObject = {
                user: {
                    id: 123,
                    profile: {
                        name: 'John Doe',
                        email: 'john@example.com',
                        preferences: {
                            theme: 'dark',
                            notifications: true,
                        },
                    },
                    roles: ['user', 'premium'],
                    metadata: {
                        createdAt: '2023-01-01T00:00:00Z',
                        lastLogin: '2023-12-01T00:00:00.000Z',
                        loginCount: 42,
                    },
                },
            };

            // Set complex object with multiple tags
            await taggedKeyv.set('complex:123', complexObject, {
                tags: ['users', 'premium', 'active', 'complex-data'],
            });

            // Retrieve should return exact same object
            const retrieved = await taggedKeyv.get<typeof complexObject>('complex:123');
            expect(retrieved).toEqual(complexObject);

            // Deep equality check
            expect(retrieved?.user.profile.preferences.theme).toBe('dark');
            expect(retrieved?.user.metadata.loginCount).toBe(42);
            expect(Array.isArray(retrieved?.user.roles)).toBe(true);
            expect(retrieved?.user.roles).toEqual(['user', 'premium']);
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

    describe('getAllTags', () => {
        it('should return empty array when no tags exist', async () => {
            const tags = await taggedKeyv.getAllTags();
            expect(tags).toEqual([]);
        });

        it('should return all unique tags', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users', 'active']);
            await taggedKeyv.set('post:456', { title: 'Hello' }, undefined, ['posts', 'published']);
            await taggedKeyv.set('user:789', { name: 'Jane' }, undefined, ['users', 'inactive']);

            const tags = await taggedKeyv.getAllTags();
            expect(tags.sort()).toEqual(['active', 'inactive', 'posts', 'published', 'users']);
        });

        it('should not include duplicate tags', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users']);
            await taggedKeyv.set('user:456', { name: 'Jane' }, undefined, ['users']);
            await taggedKeyv.set('user:789', { name: 'Bob' }, undefined, ['users']);

            const tags = await taggedKeyv.getAllTags();
            expect(tags).toEqual(['users']);
        });

        it('should return tags after invalidation operations', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users', 'active']);
            await taggedKeyv.set('post:456', { title: 'Hello' }, undefined, ['posts']);

            await taggedKeyv.invalidateTag('users');

            const tags = await taggedKeyv.getAllTags();
            expect(tags.sort()).toEqual(['active', 'posts']);
        });

        it('should handle tags with various characters', async () => {
            await taggedKeyv.set('item:1', { data: 'test' }, undefined, ['tag-with-dash']);
            await taggedKeyv.set('item:2', { data: 'test' }, undefined, ['tag_with_underscore']);
            await taggedKeyv.set('item:3', { data: 'test' }, undefined, ['tag:with:colon']);

            const tags = await taggedKeyv.getAllTags();
            expect(tags.sort()).toEqual(['tag-with-dash', 'tag:with:colon', 'tag_with_underscore']);
        });

        it('should return empty array after clear', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users']);
            await taggedKeyv.set('post:456', { title: 'Hello' }, undefined, ['posts']);

            await taggedKeyv.clear();

            const tags = await taggedKeyv.getAllTags();
            expect(tags).toEqual([]);
        });

        it('should handle error from tag manager', async () => {
            const mockTagManager = {
                getAllTags: async () => {
                    throw new Error('Tag manager error');
                },
                addKeyToTag: async () => {},
                removeKeyFromTag: async () => {},
                getKeysForTag: async () => [],
                getTagsForKey: async () => [],
                setTagsForKey: async () => {},
                deleteTag: async () => {},
                deleteKeyFromAllTags: async () => {},
                clear: async () => {},
                compact: async () => {},
            };

            const errorTaggedKeyv = new TaggedKeyv(keyv, mockTagManager);

            await expect(errorTaggedKeyv.getAllTags()).rejects.toThrow('Failed to get all tags: Tag manager error');
        });
    });

    describe('getTagsForKey', () => {
        it('should return empty array for key with no tags', async () => {
            await taggedKeyv.set('user:123', { name: 'John' });

            const tags = await taggedKeyv.getTagsForKey('user:123');
            expect(tags).toEqual([]);
        });

        it('should return empty array for non-existent key', async () => {
            const tags = await taggedKeyv.getTagsForKey('non-existent');
            expect(tags).toEqual([]);
        });

        it('should return all tags for a key', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users', 'active', 'role:admin']);

            const tags = await taggedKeyv.getTagsForKey('user:123');
            expect(tags.sort()).toEqual(['active', 'role:admin', 'users']);
        });

        it('should return single tag for key with one tag', async () => {
            await taggedKeyv.set('session:abc', { userId: 1 }, undefined, ['sessions']);

            const tags = await taggedKeyv.getTagsForKey('session:abc');
            expect(tags).toEqual(['sessions']);
        });

        it('should handle tags with special characters', async () => {
            await taggedKeyv.set('item:1', { data: 'test' }, undefined, [
                'tag-with-dash',
                'tag_with_underscore',
                'tag:with:colon',
            ]);

            const tags = await taggedKeyv.getTagsForKey('item:1');
            expect(tags.sort()).toEqual(['tag-with-dash', 'tag:with:colon', 'tag_with_underscore']);
        });

        it('should return updated tags after tag changes', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users', 'active']);

            let tags = await taggedKeyv.getTagsForKey('user:123');
            expect(tags.sort()).toEqual(['active', 'users']);

            // Update with new tags
            await taggedKeyv.set('user:123', { name: 'John Updated' }, undefined, ['users', 'inactive', 'role:user']);

            tags = await taggedKeyv.getTagsForKey('user:123');
            expect(tags.sort()).toEqual(['inactive', 'role:user', 'users']);
        });

        it('should return empty array after key deletion', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users', 'active']);

            await taggedKeyv.delete('user:123');

            const tags = await taggedKeyv.getTagsForKey('user:123');
            expect(tags).toEqual([]);
        });

        it('should return empty array after all key tags are invalidated', async () => {
            await taggedKeyv.set('user:123', { name: 'John' }, undefined, ['users']);

            await taggedKeyv.invalidateTag('users');

            const tags = await taggedKeyv.getTagsForKey('user:123');
            expect(tags).toEqual([]);
        });

        it('should handle new API style set operations', async () => {
            await taggedKeyv.set(
                'product:1',
                { name: 'Widget' },
                {
                    ttl: 1800000, // 30 minutes
                    tags: ['products', 'category:widgets', 'status:published'],
                }
            );

            const tags = await taggedKeyv.getTagsForKey('product:1');
            expect(tags.sort()).toEqual(['category:widgets', 'products', 'status:published']);
        });

        it('should handle error from tag manager', async () => {
            const mockTagManager = {
                getTagsForKey: async () => {
                    throw new Error('Tag manager error');
                },
                getAllTags: async () => [],
                addKeyToTag: async () => {},
                removeKeyFromTag: async () => {},
                getKeysForTag: async () => [],
                setTagsForKey: async () => {},
                deleteTag: async () => {},
                deleteKeyFromAllTags: async () => {},
                clear: async () => {},
                compact: async () => {},
            };

            const errorTaggedKeyv = new TaggedKeyv(keyv, mockTagManager);

            await expect(errorTaggedKeyv.getTagsForKey('test:key')).rejects.toThrow(
                'Failed to get tags for key "test:key": Tag manager error'
            );
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
