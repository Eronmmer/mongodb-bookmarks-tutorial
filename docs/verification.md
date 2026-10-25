# Bookmark app verification

Verified on 25 October 2026. Application and verification code: `32a6c7ce838489f7f9fb2b8f591f2b185904adfe`. Subsequent evidence/document changes do not change that runtime.

## Environment and provenance

- Upstream: `mongodb-developer/nextjs-template-mongodb`, commit `09278fa9369ce03c3e988156351655f87317ecf6`.
- Local environment: macOS on Apple silicon; Node 24.22.1.
- Lockfile resolutions: Next.js 16.4.3, React 19.2.7, MongoDB Node.js driver 7.5.0, Playwright 1.61.1.
- Database: real MongoDB 8.2.6, started on loopback with temporary storage. Its version was also confirmed using `buildInfo`.
- Final verification checkout: `/tmp/mongodb-bookmarks-verified-20261025`, cloned with `git clone --no-local`. No `node_modules`, `.env` or `.next` was copied into it. `npm ci` installed dependencies. Existing machine-wide npm, Chromium and MongoDB binary download caches were reused.
- The final configuration update was fetched into that checkout before the final production/development runs. Both finished successfully and left tracked files unchanged.

## Executed checks

| Check | Result |
| --- | --- |
| Fresh checkout dependency install, `npm ci` | Passed |
| Chromium installation, `npx playwright install chromium` | Passed |
| ESLint | Passed, no lint findings |
| TypeScript, `tsc --noEmit` | Passed |
| Validation unit suite | 6 passed |
| Production build with `MONGODB_URI` explicitly empty | Passed; home route is dynamic |
| Production browser suite, healthy MongoDB | 10 passed |
| Production browser suite, missing URI | 1 passed |
| Production browser suite, unreachable MongoDB | 1 passed |
| Development browser suite, healthy MongoDB | 10 passed |
| Development browser suite, missing URI | 1 passed |
| Development browser suite, unreachable MongoDB | 1 passed |
| Verification server cleanup | All 6 final-run app ports were closed afterward |
| Manual README setup and CRUD in Chrome | Passed |
| Local helper with port 27028 already occupied | Exited 1; did not switch to another port |
| Independent review of final runtime commit | No outstanding findings |

The browser total is **24 executed checks across two runtimes**. Scenario-inapplicable cases are reported as skipped by Playwright; they are not counted as passes.

The browser suite verifies empty state; two consecutive creates and cleared forms; reload persistence; fixed stored fields and BSON timestamps; edit/cancel behavior; preserved creation time; delete confirmation/cancellation; invalid input and retained values; disabled pending controls; escaped HTML-like notes; invalid identifiers; records removed before a mutation; newest-100 ordering/limit disclosure; and narrow-screen overflow. Assertions inspect the temporary MongoDB documents as well as the UI. Missing/unreachable database runs verify an outage message rather than an empty list and preserve rejected create input.

The harness overrides connection configuration, creates a unique `bookmarks_test_` database and owns its server processes. Tests reject non-loopback or non-test database targets. These tests did not use Atlas or the manual preview database.

## Manual setup check

In the clean checkout, after automated verification:

1. Copied `.env.example` to `.env`.
2. Started `npm run db:local`; it reported the documented loopback URI and port.
3. Started `npm run dev -- --hostname 127.0.0.1 --port 3130`. Port 3130 separated this check from the existing preview; Next.js reported loading `.env`.
4. In Chrome, created a sample bookmark, reloaded, edited its note and confirmed deletion. The UI returned to the empty state; a direct database count confirmed zero remaining records.
5. Stopped that development server. The checkout's tracked files remained clean.

The desktop screenshot in `docs/images/bookmarks-desktop.png` was captured from the running application. Automated narrow-screen checks used a 375 × 812 viewport; this is not a claim of exhaustive accessibility or cross-browser testing.

## Repairs made during verification

Fixed asynchronous collection access, driver ObjectId typing, blank-title validation, malformed shorthand HTTP URLs, repeated-create form reset, long-text wrapping, pending cancellation controls, a missing template font variable, fixed-port local database startup, and signaling of already-exited test processes. Corrected browser-test expectations for native URL whitespace normalization and scoped alerts to avoid Next.js's route announcer.

## Limits and publication follow-up

- Atlas provisioning/credentials/network access, Codespaces creation, hosted GitHub Actions and Vercel deployment/protection were **not executed**. README instructions cite primary documentation, but local results do not prove those hosted flows.
- A restricted deployment still needs an unauthenticated page check and a valid Server Action POST check, plus authorized CRUD, before sharing it. There is no application-level authentication or per-user ownership.
- A fresh npm audit reported four moderate findings in the Tailwind 3/PostCSS selector parser dependency chain, with no high or critical findings. This remains a dependency limitation; no zero-vulnerability or production-readiness claim is made.
- The verification wrapper supports POSIX process groups (macOS/Linux/WSL). Only the macOS environment above was executed. Native Windows, Firefox, WebKit, load behavior and live database failover were not tested.
- The completed app is hosted in [Eronmmer/mongodb-bookmarks-tutorial](https://github.com/Eronmmer/mongodb-bookmarks-tutorial), a private repository created at the user's request. Public reader access and the hosted demo URL remain pending. No upstream repository was modified.
- MongoDB technical/editorial review and publication approval remain separate from this engineering verification.

## Reproduce

Use the repository's pinned Node version, then run:

```bash
npm ci
npx playwright install --with-deps chromium
npm run verify
npm run verify:dev
```

The test harness does not require an Atlas account or a local `.env` file. The local demo helper is disposable: stopping it deletes its data.
