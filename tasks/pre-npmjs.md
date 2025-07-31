# Pre-NPM-Release Checklist

This document outlines the necessary steps to prepare the `tagged-keyv-wrapper` project for its initial public release on NPM.

## 1. Package.json Configuration

The `package.json` file is the most critical piece of metadata for an NPM package. The following fields need to be reviewed and updated:

-   **`name`**: The current name is `tagged-keyv-wrapper`. You should consider a scoped name like `@your-npm-username/tagged-keyv-wrapper` to avoid potential naming conflicts. **Action:** Decide on a final package name.
-   **`version`**: The current version is `0.1.0`. For an initial release, `1.0.0` is recommended, or you can stick with `0.1.0` if you consider it a beta release. **Action:** Set an appropriate initial version.
-   **`main`**: Currently `src/index.ts`. This should point to the compiled JavaScript entry point, which will be `dist/index.js` after building. **Action:** Change to `dist/index.js`.
-   **`types`**: Currently `src/index.ts`. This should point to the corresponding type declaration file, which will be `dist/index.d.ts`. **Action:** Change to `dist/index.d.ts`.
-   **`files`**: This field is missing. It is the recommended way to specify which files get included in your published package. **Action:** Add a `files` array. It should include your compiled output and essential documentation. For example: `[ "dist", "README.md", "LICENSE", "CONTRIBUTING.md" ]`.
-   **`description`**: Add a brief, descriptive sentence about the package.
-   **`keywords`**: Add relevant keywords to improve discoverability on NPM (e.g., `keyv`, `cache`, `tagging`, `invalidation`).
-   **`author`**: Angel S. Moreno (angelxmoreno@gmail.com) (https://angelxmoreno.github.io/)
-   **`license`**: The `README.md` mentions an MIT license, but it's not specified in `package.json`. **Action:** Add `"license": "MIT"`.
-   **`repository`**: Add a `repository` field with the URL to the GitHub repository.
-   **`homepage`**: Add a `homepage` field, which can be the same as the repository URL.
-   **`bugs`**: Add a `bugs` field with the URL to the GitHub issues page.

## 2. Build Process

The current `build` script (`rm -rf dist && tsc`) is functional. However, the `tsconfig.json` has an `extends` field that might rely on a file outside this project (`@repo/typescript-config/tsconfig.packages.json`).

-   **Action:** Ensure that the `tsconfig.json` is self-contained or that the extended configuration is published as a separate package. For a standalone release, it's often better to have a self-contained `tsconfig.json`.
-   **Action:** Run the `bun run build` command and verify that the `dist` directory is created with the expected JavaScript and type declaration files.

## 3. OSS Documentation

To make your project welcoming and clear for users and potential contributors, add the following files to the root of your project:

-   **`LICENSE`**: Create a `LICENSE` file. Since you've specified "MIT" in the `package.json`, you should include the full MIT License text in this file. You can easily find the standard MIT License text online.
-   **`CONTRIBUTING.md`**: Create a `CONTRIBUTING.md` file. This document explains how others can contribute to your project. It should include information on:
    -   How to report bugs.
    -   How to suggest features.
    -   How to set up the development environment.
    -   The process for submitting pull requests (e.g., coding standards, running tests).
-   **`CODE_OF_CONDUCT.md`** (Optional but Recommended): Consider adding a Code of Conduct to foster a positive and inclusive community. The Contributor Covenant is a popular choice.

## 4. Readme Updates

The `README.md` is excellent. No major changes are needed, but you should update the installation instructions to use `npm install` or `yarn add` with your final chosen package name once it's decided.

## 5. Testing and CI

The existing tests and the CI workflow are great for ensuring code quality. Before publishing, ensure that all tests are passing on the `main` branch.

## 6. Publishing

Once all the above steps are completed, you can publish the package to NPM.

1.  **Login to NPM**: `npm login`
2.  **Build Your Project**: `bun run build`
3.  **Dry Run**: `npm publish --dry-run`. This is a crucial step that shows you exactly which files will be included in the final package without actually publishing it. Review the file list carefully to ensure it matches the `files` array in your `package.json`.
4.  **Publish**: `npm publish` (or `npm publish --access public` if you are using a scoped package for the first time).