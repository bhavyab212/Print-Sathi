# Handoff Report: Milestone 0 (Playwright Setup)

## 1. Observation
- Inspected `/media/bhavya/backup and etc/Project/Printo_/apps/web/package.json`: No `@playwright/test` or `playwright` packages are installed. No `test` or `e2e` scripts exist.
- Inspected `/media/bhavya/backup and etc/Project/Printo_/apps/web/.gitignore`: Playwright output directories (`playwright-report`, `test-results`, `blob-report`) are not ignored.
- Ran `find_by_name` for `playwright.config*` in `apps/web`: 0 results found.
- Listed directory `apps/web`: `e2e` folder does not exist.
- Read `TEST_INFRA.md` & `.agents/sub_orch_tier1/SCOPE.md`: The test framework must be Playwright (`@playwright/test`), with tests in `apps/web/e2e/`. Tests are invoked via `npx playwright test`.

## 2. Logic Chain
- Since `package.json` lacks Playwright dependencies, they need to be added.
- The absence of `playwright.config.ts` means a base config needs to be created, targeting the `apps/web/e2e/` folder as the `testDir` and integrating seamlessly with Next.js.
- Playwright generates artifacts (reports, traces, test results) which should not be tracked by git. Therefore, `.gitignore` should be updated.
- A script in `package.json` for invoking Playwright simplifies CI and local runs.

## 3. Caveats
- The `playwright.config.ts` can optionally use a `webServer` setting to automatically start Next.js (`npm run dev`) before testing. For Print-Sathi local e2e testing, this is highly recommended so `npx playwright test` can run standalone.
- The implementer will need to run `npx playwright install --with-deps` (or at least `chromium`) on their system to download the browsers.

## 4. Conclusion
To implement Milestone 0, the implementer should perform the following actions:
1. **Dependencies:** Install Playwright dependencies in `apps/web`.
   ```bash
   npm install -D @playwright/test playwright
   ```
2. **Configuration:** Create `apps/web/playwright.config.ts` with:
   - `testDir: './e2e'`
   - `fullyParallel: true`
   - `reporter: 'html'`
   - `use: { baseURL: 'http://127.0.0.1:3000', trace: 'on-first-retry' }`
   - `webServer: { command: 'npm run dev', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI }`
3. **Directory:** Create the `apps/web/e2e/` directory.
4. **Scripts:** Add `"test:e2e": "playwright test"` to `apps/web/package.json`.
5. **Gitignore:** Add the following to `apps/web/.gitignore`:
   ```
   # playwright
   playwright-report/
   test-results/
   blob-report/
   playwright/.cache/
   ```

## 5. Verification Method
- **Command:** Run `npm run test:e2e` or `npx playwright test` inside `apps/web`.
- **Criteria:** The command should execute successfully without errors. It will say "no tests found" because `e2e` is empty, which is the expected and valid result for Milestone 0.
