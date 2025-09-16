# Proposed Improvements

This document outlines a list of proposed tasks and ideas to improve and extend the `tagged-keyv-wrapper` library.

## Feature Enhancements

- **List All Tags:** ([Issue #5](https://github.com/angelxmoreno/tagged-keyv-wrapper/issues/5))
  - Implement a method like `getAllTags()` to return a list of all unique tag names currently in use.

- **Wildcard Tag Operations:**
  - Implement support for wildcard invalidation (e.g., `invalidateTag('user:*')`).
  - Consider adding wildcard support for `getByTag` as well.

- **TTL for Tags:**
  - Introduce an optional Time-To-Live (TTL) for entire tags. When a tag expires, all associated keys are invalidated. This could be useful for time-sensitive groups of data, like promotions or user sessions.

- **Enhanced `getByTag` Functionality:** ([Issue #6](https://github.com/angelxmoreno/tagged-keyv-wrapper/issues/6))
  - Add options for pagination (limit/offset) to the `getByTag` method to handle cases where a tag might have thousands of associated keys.
  - Explore adding filtering capabilities to `getByTag`.

## Performance and Reliability

- **Atomic Operations Review:**
  - Conduct a thorough review of operations that modify both the data store and the tag store (like `set` and `delete`) to ensure they are atomic. Investigate using transactions if the underlying Keyv store adapter supports them to prevent partial updates in case of an error.

- **Performance Benchmarking Suite:**
  - Create a suite of benchmarks to measure the performance overhead of tagging.
  - Compare the performance of `set`, `get`, `delete` with and without tags.
  - Benchmark `invalidateTag` and `getByTag` with a large number of keys.

## API and Developer Experience

- **Create `llms.txt` for AI Discovery:** ([Issue #7](https://github.com/angelxmoreno/tagged-keyv-wrapper/issues/7))
  - Add an `llms.txt` file to the root of the documentation website. This file will serve as a curated index for Large Language Models, pointing them to the most valuable content (like API reference, usage examples, and architectural overview) to improve AI-generated answers about the library.

- **Full Keyv API Compatibility:**
  - Audit the `@keyvhq/core` API and ensure that `TaggedKeyv` exposes or properly wraps all of its methods and properties to guarantee 100% drop-in compatibility.

- **More Usage Examples:**
  - Add more advanced usage examples to the documentation, including error handling and edge cases.