# Handoff: Milestone 0 Playwright Setup Analysis

## Observation
- **`TEST_INFRA.md`**: Specifies Playwright (`@playwright/test`) as the framework. Invocation: `npx playwright test`. Directory layout: `apps/web/e2e/`. Expected to pass with exit code 0.
- **`SCOPE.md`**: Outlines "Milestone 0: Playwright Setup" to "Install and configure Playwright in `apps/web`". E2E tests will output to `apps/web/e2e/tier1_*.spec.ts`.
- **`package.json`**: Examined `apps/web/package.json`. Playwright (`@playwright/test`) is currently missing from `devDependencies` and there are no Playwright-related scripts.
- **File System**: `apps/web/playwright.config.ts` does not exist. The `apps/web/e2e` directory does not exist. 

## Logic Chain
1. Since `@playwright/test` is absent, it must be installed as a development dependency (`npm install -D @playwright/test`) within `apps/web`.
2. A configuration file (`playwright.config.ts`) needs to be created in `apps/web` to define global test settings, as it doesn't currently exist.
3. According to `TEST_INFRA.md` and `SCOPE.md`, the tests must reside in the `apps/web/e2e/` folder. Therefore, the `testDir` in `playwright.config.ts` should be set to `'./e2e'`, and the directory should be created.
4. To fulfill the `TEST_INFRA.md` contract (`npx playwright test`), Playwright must be correctly configured to start the Next.js dev server or expect it to be running (e.g., using a `webServer` block in `playwright.config.ts` pointing to `npm run dev` on port 3000).
5. The environment requires Playwright browsers to be installed (`npx playwright install --with-deps chromium`) to execute the tests.

## Caveats
- The app uses Supabase (as seen in `package.json` dependencies). The Next.js application needs environment variables (like `NEXT_PUBLIC_SUPABASE_URL`) to function. The E2E tests or the Next.js dev server spawned by Playwright will require access to `.env.local` or these variables must be provided in the test environment.
- I assumed only the Chromium browser is required initially to keep the setup fast, but `playwright.config.ts` could configure multiple browsers.

## Conclusion
To complete Milestone 0, the implementer should:
1. Run `npm install -D @playwright/test` in `apps/web`.
2. Run `npx playwright install --with-deps chromium` to ensure browsers are ready.
3. Create `apps/web/playwright.config.ts` with `testDir: './e2e'` and a `webServer` block configured to run the Next.js app (`npm run dev`, port 3000).
4. Create the `apps/web/e2e` directory.
5. (Optional but recommended) Create a simple sanity test (e.g., `apps/web/e2e/setup.spec.ts`) to verify that the runner and Next.js server start successfully.

## Verification Method
1. Inspect `apps/web/package.json` to confirm `@playwright/test` is in `devDependencies`.
2. Verify `apps/web/playwright.config.ts` exists and has `testDir: './e2e'`.
3. Verify the `apps/web/e2e` directory exists.
4. Run `npx playwright test` in `apps/web`. It should successfully start the Next.js server, find any dummy test (or report 0 tests), and exit with code 0 (or successfully run the setup sanity test).
