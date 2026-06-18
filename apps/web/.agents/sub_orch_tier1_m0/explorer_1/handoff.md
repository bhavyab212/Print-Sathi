# Handoff Report: Milestone 0 - Playwright Setup

## Observation
- Checked `apps/web/package.json`: It does not contain `@playwright/test` in `devDependencies` or `dependencies`. The `scripts` section only contains `dev`, `build`, `start`, and `lint`.
- Searched for Playwright configuration: Attempted to read `apps/web/playwright.config.ts`, but it does not exist.
- Checked `apps/web` directory contents: The `e2e` directory does not exist.
- Read `TEST_INFRA.md`: Requirements mandate using Playwright (`@playwright/test`), a directory layout of `apps/web/e2e/`, invocation via `npx playwright test`, and outputs like `tier1_*.spec.ts`.
- Read `.agents/sub_orch_tier1/SCOPE.md`: Milestone 0 is explicitly "Install and configure Playwright in `apps/web`" with no external dependencies.

## Logic Chain
1. Because `package.json` lacks `@playwright/test`, the package must be installed as a development dependency. Playwright browsers must also be installed to ensure the tests have the necessary binaries.
2. Because `playwright.config.ts` does not exist, a configuration file needs to be generated to instruct Playwright where to look for tests (`testDir: './e2e'`).
3. Because the `e2e` directory does not exist, it must be created to hold the test files, aligning with the required directory layout.
4. Because this is a Next.js application, Playwright needs to spin up the web application before running tests. The `webServer` option in the Playwright config must be configured to run `npm run dev` (or a build/start combo) and wait for the `url` (e.g., `http://127.0.0.1:3000`).
5. A standard convenience script (e.g., `"test:e2e": "playwright test"`) should be added to `package.json`'s `scripts` for discoverability, although `TEST_INFRA.md` permits direct `npx playwright test` usage.

## Caveats
- Playwright's `webServer` can run either the Next.js development server (`npm run dev`) or the production server (`npm run build && npm run start`). The dev server is usually faster to start for iterative local test authoring, while production parity is better for CI. The implementation agent should decide or configure Playwright to use `dev` by default with an override for CI.
- I haven't verified the exact port Next.js will use on the current host, but it defaults to `3000`. The Next.js command currently specifies `--hostname 0.0.0.0`. The `playwright.config.ts` should ensure its `baseURL` and `webServer.url` match this correctly.

## Conclusion
To fulfill Milestone 0:
1. Run `npm install -D @playwright/test` inside `apps/web`.
2. Run `npx playwright install --with-deps` inside `apps/web` to install browser binaries.
3. Create the `apps/web/e2e` directory.
4. Create `apps/web/playwright.config.ts` configured with `testDir: './e2e'` and a `webServer` block that launches the Next.js app.
5. (Optional but recommended) Add a `"test:e2e": "playwright test"` script to `apps/web/package.json`.

## Verification Method
1. Inspect `apps/web/package.json` to confirm `@playwright/test` is present.
2. Inspect the filesystem to confirm `apps/web/e2e` and `apps/web/playwright.config.ts` exist.
3. To functionally verify, create a dummy test (e.g., `apps/web/e2e/setup.spec.ts`) with a basic passing assertion (`expect(true).toBe(true)`).
4. Run `npx playwright test` in `apps/web`.
5. The command should start the Next.js server, execute the dummy test, and pass with exit code 0.
