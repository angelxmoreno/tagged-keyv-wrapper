/** biome-ignore-all lint/complexity/noStaticOnlyClass:  it's just a helper **/

import { expect } from 'bun:test';
import Keyv from '@keyvhq/core';

/**
 * Creates a new in-memory Keyv instance for testing
 */
export function createTestKeyv(): Keyv {
    return new Keyv();
}

/**
 * Test utilities for assertions
 */
export class TestUtils {
    static async sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    static expectArraysEqual<T>(actual: T[], expected: T[]): void {
        expect(actual.length).toBe(expected.length);
        for (const item of expected) {
            expect(actual).toContain(item);
        }
    }

    static expectArraysEqualUnordered<T>(actual: T[], expected: T[]): void {
        expect(actual.length).toBe(expected.length);
        const sortedActual = [...actual].sort();
        const sortedExpected = [...expected].sort();
        expect(sortedActual).toEqual(sortedExpected);
    }
}
