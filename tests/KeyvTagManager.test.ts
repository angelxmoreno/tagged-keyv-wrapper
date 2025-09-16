import { beforeEach, describe, expect, it } from 'bun:test';
import type Keyv from '@keyvhq/core';
import { KeyvTagManager } from '../src';
import { createTestKeyv, TestUtils } from './helpers';

describe('KeyvTagManager', () => {
    let keyv: Keyv;
    let tagManager: KeyvTagManager;

    beforeEach(() => {
        keyv = createTestKeyv();
        tagManager = new KeyvTagManager(keyv);
    });

    describe('addKeyToTag', () => {
        it('should add a key to a tag', async () => {
            await tagManager.addKeyToTag('user:123', 'users');

            const keys = await tagManager.getKeysForTag('users');
            expect(keys).toContain('user:123');
        });

        it('should not add duplicate keys to the same tag', async () => {
            await tagManager.addKeyToTag('user:123', 'users');
            await tagManager.addKeyToTag('user:123', 'users');

            const keys = await tagManager.getKeysForTag('users');
            expect(keys).toEqual(['user:123']);
        });

        it('should handle multiple keys for the same tag', async () => {
            await tagManager.addKeyToTag('user:123', 'users');
            await tagManager.addKeyToTag('user:456', 'users');

            const keys = await tagManager.getKeysForTag('users');
            TestUtils.expectArraysEqualUnordered(keys, ['user:123', 'user:456']);
        });
    });

    describe('removeKeyFromTag', () => {
        it('should remove a key from a tag', async () => {
            await tagManager.addKeyToTag('user:123', 'users');
            await tagManager.addKeyToTag('user:456', 'users');

            await tagManager.removeKeyFromTag('user:123', 'users');

            const keys = await tagManager.getKeysForTag('users');
            expect(keys).toEqual(['user:456']);
        });

        it('should delete the tag when no keys remain', async () => {
            await tagManager.addKeyToTag('user:123', 'users');
            await tagManager.removeKeyFromTag('user:123', 'users');

            const keys = await tagManager.getKeysForTag('users');
            expect(keys).toEqual([]);
        });

        it('should handle removing non-existent keys gracefully', async () => {
            await tagManager.addKeyToTag('user:123', 'users');
            await tagManager.removeKeyFromTag('user:456', 'users');

            const keys = await tagManager.getKeysForTag('users');
            expect(keys).toEqual(['user:123']);
        });
    });

    describe('getKeysForTag', () => {
        it('should return empty array for non-existent tag', async () => {
            const keys = await tagManager.getKeysForTag('nonexistent');
            expect(keys).toEqual([]);
        });

        it('should return all keys for a tag', async () => {
            await tagManager.addKeyToTag('user:123', 'users');
            await tagManager.addKeyToTag('user:456', 'users');

            const keys = await tagManager.getKeysForTag('users');
            TestUtils.expectArraysEqualUnordered(keys, ['user:123', 'user:456']);
        });
    });

    describe('getTagsForKey', () => {
        it('should return empty array for non-existent key', async () => {
            const tags = await tagManager.getTagsForKey('nonexistent');
            expect(tags).toEqual([]);
        });

        it('should return all tags for a key', async () => {
            await tagManager.setTagsForKey('user:123', ['users', 'active']);

            const tags = await tagManager.getTagsForKey('user:123');
            TestUtils.expectArraysEqualUnordered(tags, ['users', 'active']);
        });
    });

    describe('setTagsForKey', () => {
        it('should set tags for a key', async () => {
            await tagManager.setTagsForKey('user:123', ['users', 'active']);

            const tags = await tagManager.getTagsForKey('user:123');
            TestUtils.expectArraysEqualUnordered(tags, ['users', 'active']);

            const userKeys = await tagManager.getKeysForTag('users');
            expect(userKeys).toContain('user:123');

            const activeKeys = await tagManager.getKeysForTag('active');
            expect(activeKeys).toContain('user:123');
        });

        it('should replace existing tags', async () => {
            await tagManager.setTagsForKey('user:123', ['users', 'active']);
            await tagManager.setTagsForKey('user:123', ['users', 'premium']);

            const tags = await tagManager.getTagsForKey('user:123');
            TestUtils.expectArraysEqualUnordered(tags, ['users', 'premium']);

            const activeKeys = await tagManager.getKeysForTag('active');
            expect(activeKeys).toEqual([]);

            const premiumKeys = await tagManager.getKeysForTag('premium');
            expect(premiumKeys).toContain('user:123');
        });

        it('should handle empty tags array', async () => {
            await tagManager.setTagsForKey('user:123', ['users']);
            await tagManager.setTagsForKey('user:123', []);

            const tags = await tagManager.getTagsForKey('user:123');
            expect(tags).toEqual([]);
        });
    });

    describe('deleteTag', () => {
        it('should delete a tag and remove it from all keys', async () => {
            await tagManager.setTagsForKey('user:123', ['users', 'active']);
            await tagManager.setTagsForKey('user:456', ['users', 'premium']);

            await tagManager.deleteTag('users');

            const keys = await tagManager.getKeysForTag('users');
            expect(keys).toEqual([]);

            const user123Tags = await tagManager.getTagsForKey('user:123');
            expect(user123Tags).toEqual(['active']);

            const user456Tags = await tagManager.getTagsForKey('user:456');
            expect(user456Tags).toEqual(['premium']);
        });

        it('should handle deleting non-existent tag', async () => {
            await tagManager.deleteTag('nonexistent');
            // Should not throw
        });
    });

    describe('deleteKeyFromAllTags', () => {
        it('should remove a key from all its tags', async () => {
            await tagManager.setTagsForKey('user:123', ['users', 'active']);
            await tagManager.setTagsForKey('user:456', ['users', 'premium']);

            await tagManager.deleteKeyFromAllTags('user:123');

            const userKeys = await tagManager.getKeysForTag('users');
            expect(userKeys).toEqual(['user:456']);

            const activeKeys = await tagManager.getKeysForTag('active');
            expect(activeKeys).toEqual([]);

            const user123Tags = await tagManager.getTagsForKey('user:123');
            expect(user123Tags).toEqual([]);
        });

        it('should handle deleting non-existent key', async () => {
            await tagManager.deleteKeyFromAllTags('nonexistent');
            // Should not throw
        });
    });

    describe('clear', () => {
        it('should clear all data', async () => {
            await tagManager.setTagsForKey('user:123', ['users', 'active']);
            await tagManager.setTagsForKey('user:456', ['users', 'premium']);

            await tagManager.clear();

            const userKeys = await tagManager.getKeysForTag('users');
            expect(userKeys).toEqual([]);

            const user123Tags = await tagManager.getTagsForKey('user:123');
            expect(user123Tags).toEqual([]);
        });
    });

    describe('compact', () => {
        it('should remove dead keys from tag arrays', async () => {
            // Set up some data with actual values in cache
            await keyv.set('user:123', 'value1');
            await keyv.set('user:456', 'value2');
            await tagManager.setTagsForKey('user:123', ['users']);
            await tagManager.setTagsForKey('user:456', ['users']);

            // Manually add a dead key to simulate orphaned data
            await keyv.set('__tag__:users', ['user:123', 'user:456', 'user:789']);

            await tagManager.compact(['users']);

            const keys = await tagManager.getKeysForTag('users');
            TestUtils.expectArraysEqualUnordered(keys, ['user:123', 'user:456']);
        });

        it('should remove duplicate keys from tag arrays', async () => {
            // Manually create duplicates
            await keyv.set('__tag__:users', ['user:123', 'user:123', 'user:456']);
            await keyv.set('user:123', 'some value');
            await keyv.set('user:456', 'some value');

            await tagManager.compact(['users']);

            const keys = await tagManager.getKeysForTag('users');
            TestUtils.expectArraysEqualUnordered(keys, ['user:123', 'user:456']);
        });

        it('should delete empty tag arrays after compaction', async () => {
            // Create a tag with only dead keys
            await keyv.set('__tag__:users', ['user:123', 'user:456']);

            await tagManager.compact(['users']);

            const keys = await tagManager.getKeysForTag('users');
            expect(keys).toEqual([]);
        });

        it('should throw error for global compaction', async () => {
            await expect(tagManager.compact()).rejects.toThrow('Global tag compaction not implemented');
        });
    });

    describe('getAllTags', () => {
        it('should return all unique tags', async () => {
            await tagManager.setTagsForKey('user:123', ['users', 'active']);
            await tagManager.setTagsForKey('product:abc', ['products', 'featured']);
            await tagManager.setTagsForKey('order:xyz', ['orders']);

            const allTags = await tagManager.getAllTags();
            TestUtils.expectArraysEqualUnordered(allTags, ['users', 'active', 'products', 'featured', 'orders']);
        });

        it('should return an empty array if no tags exist', async () => {
            const allTags = await tagManager.getAllTags();
            expect(allTags).toEqual([]);
        });

        it('should return unique tags even with duplicates in storage', async () => {
            await tagManager.addKeyToTag('key1', 'tagA');
            await tagManager.addKeyToTag('key2', 'tagA');
            await tagManager.addKeyToTag('key3', 'tagB');

            const allTags = await tagManager.getAllTags();
            TestUtils.expectArraysEqualUnordered(allTags, ['tagA', 'tagB']);
        });
    });

    describe('edge cases', () => {
        it('should handle malformed data gracefully', async () => {
            // Set invalid data directly
            await keyv.set('__tag__:users', 'invalid data');

            const keys = await tagManager.getKeysForTag('users');
            expect(keys).toEqual([]);
        });

        it('should handle non-string arrays gracefully', async () => {
            // Set invalid data directly
            await keyv.set('__tag__:users', [123, 456]);

            const keys = await tagManager.getKeysForTag('users');
            expect(keys).toEqual([]);
        });
    });
});
