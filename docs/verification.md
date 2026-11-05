# Bookmark app verification

Latest checks: **5 November 2026**. The review below records the current Node policy, main and reader commits, local and cloud checks, and article revisions. Older sections retain their original dates and scope.

The current article keeps core operations inline and links to longer supporting files. Those links require public companion access before publication. This supersedes the earlier fully self-contained format.

## Simplified dependency commands, 5 November 2026

The article now adds `server-only` and runs `npm update` against the template’s existing dependency ranges. It no longer repeats the template’s Next.js, React, MongoDB and lint dependencies in named install commands. The testing section installs `@playwright/test` and `mongodb-memory-server-core` without version suffixes. The Node minimum and lockfile guidance are unchanged.

Five isolated clean checkouts of template `09278fa9369ce03c3e988156351655f87317ecf6` received the same hash-verified article source. The selected short setup, unversioned named installs followed by `npm update`, and the previous major-selector commands resolved identical package versions throughout the dependency tree. All three passed fresh `npm ci`, lint, typechecking, a URI-free production build, and three production plus three development browser scenarios on each of Node 24.22.2 and 26.13.0. The browser scenarios cover persisted CRUD, cancelled deletion, and missing/unreachable database states with retained form input.

The two routes without `npm update` retained older tooling and failed lint. Diagnostic runs omitting only that gate confirmed their typechecking, builds and production browser flows worked, but their required verification remained failed. Their production audits reported 12 and eight affected package entries respectively. The selected route reported zero production entries and eight moderate development-tooling entries. The ESLint 9 support warning remains a maintenance follow-up. No forced dependency changes were applied.

A separate clean checkout first resolved the short setup and unversioned test-tool command on Node 26. It produced the same complete resolved tree. This was a resolution comparison, not an additional runtime test. Existing template dependencies remain within their declared ranges; future first installs of newly added packages can differ.

These experiments used disposable local MongoDB 9.0.4, not live Atlas. No application, test, dependency-manifest or lockfile changes were needed in the companion repository. Earlier cloud results retain their original scope. See the [sanitized command-comparison evidence](evidence/2026-11-05/dependency-command-comparison.json). Raw logs and independent review remain outside the repository. Scoped Google Doc readback and visual review of the two changed Shell blocks passed, preserving all existing code-block markers, images and tables. Concurrent suggestions elsewhere in the document were left untouched. See the [document checks](evidence/2026-11-05/simplified-install-document-qa.json).

## Tutorial review, Node minimum and setup verification, 5 November 2026

The article now follows one local-computer/Atlas route, lists prerequisites, explains how the template becomes the bookmark app, and introduces index and test commands where they are used. `MONGODB_URI` is blank in the example file. Node.js 24 is the minimum (`engines.node: >=24`); the guide recommends a currently supported LTS release and its latest patches, with nvm optional and `.nvmrc` set to `lts/*`. The CI matrix checks Node 24 and 26. These measured versions do not establish compatibility with every future release allowed by the engine range.

Final code/configuration commits are main `134c9c51a3445348d8f279bb2562c0ef945bc27f` and reader `d164bdd3cff87a0f858ce42913b960fc1aec60a2`. Their final changes from `e933f12` and `5d3941` affect only the root engine metadata, `.nvmrc` and explanatory README/AGENTS text; application source, tests and dependency resolutions are unchanged.

| Check | Result and scope |
| --- | --- |
| Main locked install on local Node 24.22.2 and 26.13.0 | Fresh `npm ci`; lint, types, build, 8 unit tests and 14 production browser checks passed on each version. The 14 development browser checks also passed on each. Executed candidate `fc1f75a` has the same Git tree as integrated `e933f12`. |
| Reader locked install on local Node 24.22.2 and 26.13.0 | Fresh `npm ci`, `verify` and `verify:dev` passed on `5d3941`: 3 browser scenarios per mode, per Node version. The compact reader suite has no unit runner. |
| Fresh public-template reconstruction | Started at `09278fa9369ce03c3e988156351655f87317ecf6`. On Node 24.22.2, the starter connection, first save, full CRUD and pagination checkpoints passed in article order, followed by the exact reader production/development checks. After the final Node-policy change, clean `npm ci` and both reader suites passed on Node 26.13.0 against that fresh lockfile. |
| Final main CI | [Run 42027782121](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/actions/runs/42027782121) passed on exact `134c9c5`: Node 24.22.2 and 26.13.0, with 8 unit and 14 production browser checks per job. |
| Final reader CI | [Run 42027785923](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/actions/runs/42027785923) passed on exact `d164bdd`: Node 24.22.1 and 26.13.0, with 3 production browser scenarios per job. |
| Source and partial-example comparison | All 16 complete-file references resolved to the intended immutable sources; all 7 partial examples matched after the documented whitespace/comment normalization. The first-save page remains at `88d9af5ac809d4d5cf778435d07a9af63077f793`. |

Local checks used disposable MongoDB 9.0.4 and owned loopback ports, without Atlas credentials or the existing app/database. Checkpoint-only QA helpers were restored before continuing the article steps. Fresh major-version installs resolved Next.js and its lint configuration to 16.4.5; the frozen companion lock remains on 16.4.3. Both dependency sets passed their recorded checks. Production audits found zero advisories; full audits retained eight moderate development-tooling entries associated with `GHSA-g3hv-75wg-m249`. No dependency upgrade or advisory fix is claimed for the Node-support changes.

The live browser CRUD flow first passed on `e933f12`, deployment `dpl_7vmMZXLTiKwmP4zs7frzfug1qUkp`. It was then repeated on final `134c9c5`, deployment `dpl_AdAjTsVVZTD8xGR2YdrneCkk4oBU`: create a synthetic bookmark, reload, edit its note, reload, cancel deletion, reload, confirm deletion and reload to an empty list. Both deployments report Node 26.x in Vercel metadata, despite the project dashboard default of 24.x. The final record was removed. These UI observations were made directly through the built-in browser tools; the saved screenshots support the edited and empty states, not an independent database digest.

Read-only checks on the final deployment confirmed Vercel Authentication on all deployments and zero automation bypass tokens. Anonymous GETs to the production, account, main-branch and generated deployment URLs each returned 302 to Vercel SSO. No new paired valid Server Action HTTP replay was run; earlier authenticated/unauthenticated POST evidence remains tied to its original deployment. This work also did not rerun Codespaces or connect a clean local checkout to Atlas using live credentials.

Sanitized evidence: [local test results](evidence/2026-11-05/local-tests.json), [template reconstruction](evidence/2026-11-05/reconstruction-summary.json), [final CI](evidence/2026-11-05/ci-summary.json), [live verification](evidence/2026-11-05/live-verification.json), [independent review](evidence/2026-11-05/independent-review.json) and [evidence manifest](evidence/2026-11-05/manifest.json). Raw local logs and screenshots remain outside the repository.

The final Google Doc readback and affected-page visual review passed. All 37 native code blocks, both images and both tables are intact, and the text and links match the tested article. Code introductions and filename labels now stay with their blocks. The PDF export has 28 pages. See [document QA](evidence/2026-11-05/document-qa.json). All 17 comment replies are drafted but unposted, and no comment was resolved. The companion repository remains private as requested. Its linked supporting files must become publicly accessible, or move to an approved public source, before publication; authenticated link checks do not establish public availability.

## Dependency refresh, 1 November 2026

The runtime change is `2777e29ad22f74ec7fc2c66edddbe7eceab7bf31`. The article’s separate reader source is `c07959c5b7f6d333a7e0c5ce7a8b0433c13e9d22`, retained by branch `codex/reader-dependency-refresh`. Its smaller browser suite and runner remain intentional. The first-save page stays at `88d9af5ac809d4d5cf778435d07a9af63077f793`.

The article now installs within compatible major release lines instead of prescribing exact npm patch versions. `.nvmrc` selects Node 24. The committed lockfiles record the tested resolutions for subsequent `npm ci` installs. The local and test helpers select MongoDB Server **9.0.4**, independently of the npm driver. MongoDB 8.2 reached end of life on 31 July 2026, so the earlier 8.2.6 selection was unsuitable for a new tutorial. The original brief’s required `appName` remains unchanged.

Measured versions: Node 24.22.2, npm 11.19.1, Next.js and eslint-config-next 16.4.3, React 19.3.1, MongoDB Node driver 7.8.0, Playwright 1.64.1 and mongodb-memory-server-core 11.3.0. Actual `buildInfo` confirmed MongoDB 9.0.4 on macOS arm64 and in Codespaces on Linux.

| Check | Result |
| --- | --- |
| Clean main checkout, `npm ci` | Passed |
| Main production verification | Lint, types, 8 unit tests, URI-free build and 14 browser checks passed |
| Main development verification | 14 browser checks passed |
| Reader source, production and development | 3 browser scenarios passed in each mode; production lint, types and build passed |
| Fresh public-template reconstruction | All four runnable stages passed: starter, create/read, CRUD and pagination |
| Reconstructed reader’s exact verify commands | Both modes passed |
| Source audit | 18 linked-file steps, 7 excerpts and all 36 inline code blocks matched |
| Hosted main CI | [Run 41332696807](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/actions/runs/41332696807) passed on `2777e29` |
| Hosted reader CI | [Run 41332787009](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/actions/runs/41332787009) passed on `c07959c` |
| Independent runtime review | No blocking findings on either exact source commit |
| Live Vercel UI | Create/reload/edit/reload/delete/reload passed on deployment `dpl_GHwSzpH7qrjkgCxx6iHbLD4yrgkW`, code `2777e29` |
| Live valid Server Actions | 12 anonymous requests blocked across four URLs; three identical-body authenticated controls passed on deployment `dpl_2zbLgpG3KMsB8Z69ofuqJnjFspVF`, source `723d298` |

The Codespaces check used a fresh clone of the public template inside the existing Debian 12 / Node 24 container, with the article’s exact install commands. It did not rebuild the already-compatible container. Both reader verification modes passed, `db:local` and `db:setup` worked, and all 22 delivered-file hashes matched the frozen source. Manual create/reload/edit/reload/delete/reload passed and the final database count was zero. Ports 3000 and 27028 remained private. The owned Codespace was stopped afterward; the account still showed $0 paid usage and its $0 budget remained unchanged.

For Codespaces access verification, one valid serialized create-action body returned 401 without credentials through the private forwarded port and left the database unchanged. The same body succeeded against the local development server as a positive control. Both disallowed-origin controls returned the explicit invalid-action error without changing the database. The configuration matrix confirmed that the localhost origin exception applies only to Codespaces development. These are GitHub private-port and Next.js origin checks, not Vercel production checks. [Captured Codespaces summary](evidence/2026-11-01/codespaces-summary.txt).

After the owner approved temporary test access, valid Server Action checks ran against production deployment `dpl_2zbLgpG3KMsB8Z69ofuqJnjFspVF`, source `723d298aee8edcf60ed7971d14f9b161902ed9ce`. This source includes only documentation changes after runtime commit `2777e29`. All four URLs mapped to that deployment before and after the test: the main production domain, team alias, main-branch alias and generated `koni43514` URL. The checks used the deployment's actual action references and the matching Next.js serializer. Each action body was serialized once and reused byte-for-byte across its four anonymous requests and one authenticated control on the main production domain.

All **12 anonymous POSTs returned 302 to Vercel SSO**. Their explicit headers were `Accept`, `Content-Type`, `Next-Action` and the destination's matching `Origin`, with no cookies, authorization or bypass credentials. All **three authenticated controls returned 200**, reported success and produced the expected create, update and delete results. Fresh authenticated app reads immediately after each rejected request and again after a delay showed unchanged bookmarks. Atlas Data Explorer independently refreshed the unfiltered `bookmark_app.bookmarks` collection at seven checkpoints: the empty baseline, each anonymous action batch, and each successful control. Every observation matched the expected count and fixture fields. The final empty-collection observation was taken after token revocation.

The uniquely marked fixture was removed by the successful delete control, restoring the initial empty collection. Vercel Authentication remained on **All Deployments**. The temporary token was revoked, the token registry returned to zero, and a request with the revoked token returned 302 to SSO. An earlier attempt stopped at its initial page read before submitting any action and also revoked its token. No tokens, connection strings or existing private bookmark contents are included in the saved evidence.

This follow-up verifies host access control for the recorded deployment, not application-level sign-in or per-user ownership. It used fresh app reads after individual requests and independent Atlas UI observations at action boundaries. It did **not** repeat the direct-driver BSON digest method used on 29 October or inspect unrelated collections. The earlier [pre-approval limitation](evidence/2026-11-01/production-access-limit.json) remains as history. See the [live request evidence](evidence/2026-11-01/production-server-actions.json), [Atlas observations](evidence/2026-11-01/production-atlas-observations.json), [aborted first attempt](evidence/2026-11-01/production-server-actions-attempt-01.json) and [independent review](evidence/2026-11-01/production-access-review.json).

The clean main checkout matched all 66 reviewed source/configuration/test files. It excluded mutable README/tutorial text from that comparison. In the article reconstruction, 20 of 22 final files matched exactly; the other two differed only by explanatory comments omitted from the inline snippets. Package manifests matched semantically and lockfile dependency data matched. Root lockfile `engines` metadata differed because the article sets that field after `npm update`. Existing download caches were reused. No existing local app or database was stopped.

Production `npm audit --omit=dev` reported **zero findings**. The full audit reported **16 moderate entries**, all tracing to [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) in the development linting chain. ESLint 10 still used an affected minimatch release, while several Next.js lint plugins declared support only through ESLint 9. Forced obsolete downgrades and broad cross-major overrides were not applied. This development/CI issue and the ESLint 9 maintenance concern remain unresolved.

The Google Doc was updated after the clean-template checks passed. Seven paragraphs and two code blocks were revised, and 18 source targets were updated. Both existing images and tables, all 36 native code blocks, language labels, inline code styling, the first-save link and both owner-added publication reminders were preserved. Independent readback and PDF review passed. A final wording correction changed only “starts with `v24.`.” to “reports a Node 24 release.” All runtime-tested commands and code remained identical.

Grammarly reported **10% AI text patterns and no reference matches** after the edit. Eight writing suggestions were reviewed. The double-period wording was corrected; seven suggestions for headings, code, exact labels or optional commas were left unchanged. This result is an editorial signal, not proof of authorship or originality.

Evidence: [refresh summary](evidence/2026-11-01/dependency-refresh.json), [reconstruction](evidence/2026-11-01/reconstruction-summary.json), [source audit](evidence/2026-11-01/source-audit.json), [file comparison](evidence/2026-11-01/source-comparison.json), [document review](evidence/2026-11-01/document-qa.json), [live UI check](evidence/2026-11-01/live-ui-check.json) and [Grammarly result](evidence/2026-11-01/grammarly.json). Detailed local logs and screenshots are under `/tmp/bookmarks-refresh-20261101/`.

The repository remains private. Reader access and the two owner-added link reminders still need resolution before publication, along with the publisher’s reviews. Native Windows, other browser engines, load behavior, live database failover and a full accessibility audit remain outside this verification. The Atlas cluster was not upgraded. Its dashboard displayed MongoDB **8.0.34** during the follow-up, distinct from MongoDB **9.0.4** used by the local and test helpers.

### Code-label wording, 1 November 2026

A subsequent editorial pass simplified seven code-block labels to filenames alone and removed the repeated partial-file terminology from four surrounding paragraphs in both the Google Doc and Markdown article. Complete-file copy instructions remain explicit, and the page example now introduces the part that loads the bookmarks. All 36 code blocks and every link target stayed unchanged. Google Doc readback confirmed that unrelated content, filename styling, both images and both tables were preserved. Independent wording review passed. This prose-only change did not rerun application tests or Grammarly. See the [wording verification](evidence/2026-11-01/code-label-cleanup.json).

## Historical environment and provenance, 25 October 2026

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
| Hosted GitHub Actions production verification | Passed on `1b7f100`; 6 unit tests and 12 browser checks |

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

## Hosted CI follow-up

After the private repository was created, [GitHub Actions run 40238792328](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/actions/runs/40238792328) passed on commit `1b7f100de227df763afdbae548da60d3183048e7` using the GitHub-hosted `ubuntu-latest` runner. It installed dependencies and Chromium, ran `npm run verify` (lint, types, 6 unit tests, production build and 12 production browser checks), and uploaded the Playwright reports. Development-mode verification remains the local evidence recorded above.

## Build-along reconstruction, 26 October 2026

The tutorial was reconstructed from the official template in `/tmp/mongodb-bookmarks-buildalong-20261026`, outside the primary checkout.

1. Cloned the official MongoDB Next.js template and created `codex/bookmarks` at `09278fa9369ce03c3e988156351655f87317ecf6`.
2. Added the companion repository as a read-only source and fetched `main`. Restored the article's supporting files from pinned commit `a64654df48d46a1dd892becf19597addd7aaaadc`: `package.json`, `package-lock.json`, `.nvmrc`, `.gitignore`, `next.config.ts`, `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`, `.env.example`, `scripts/local-db.mjs` and `.devcontainer/devcontainer.json`.
3. Selected Node 24.22.1 with nvm, ran `npm ci`, and copied `.env.example` to `.env`. Changed the original template client's `appName` to `devrel-tutorial-javascript-nextjstemplate`. Started an owned temporary MongoDB 8.2.6 process on the documented free port 27028 and the original template on port 3017. Built-in Chrome showed the original “Next.js with MongoDB” heading and “Database connected” badge.
4. Stopped the template server. Created the eight core application files by applying the tutorial's code blocks in order, including the append sections for database operations and Server Actions. The resulting types, validation, MongoDB client, database operations, actions, two components and page matched the pinned companion source modulo whitespace. These core files were assembled from the article, not restored from the completed app.
5. Restored only the article's test support files from the same pinned commit: `scripts/verify.mjs`, `playwright.config.ts` and `tests/unit/bookmark-validation.test.ts`. Removed the obsolete `db/connection-status.ts` and `tests/e2e/home.spec.ts`. Created the article's smaller browser suite from its code block; this is intentionally different from the repository's full browser suite.

| Reconstruction check | Result |
| --- | --- |
| Node 24.22.1 / npm 11.19.1 and `npm ci` | Passed |
| `npx playwright install --with-deps chromium` | Passed |
| `npm run verify`: lint and TypeScript | Passed |
| `npm run verify`: validation unit tests | 6 passed |
| `npm run verify`: production build with URI overridden to empty | Passed |
| Article production browser sample | 3 executed passes: healthy delete confirmation/cancel, missing-URI outage/input retention, unreachable-database outage/input retention |
| `npm run verify:dev`: article development browser sample | Same 3 checks passed |
| Built-in Chrome manual CRUD after reconstruction | Create, reload persistence, edit and confirmed deletion passed |
| Owned process cleanup | App and temporary database stopped; ports 3017 and 27028 no longer listening; browser tab closed |

Each browser invocation reports the opposite scenario's test as skipped. The reconstruction therefore contributes **3 executed browser checks per runtime**, not another full 24-check run. The existing 25 October full-suite evidence remains separate above. The manual browser check used a synthetic link and note, returned to “No bookmarks yet” after deletion, and did not touch shared data. Port 3017 was the only manual startup deviation from the article's default port 3000, chosen to avoid the existing preview.

The initial starter page emitted a hydration warning at its original shadcn Button/Link under the refreshed dependencies; its connection badge was visible. This warning was not observed in the reconstructed bookmarks application's manual server log. `git diff --check` also identified trailing whitespace already present in the pinned support file `tailwind.config.ts:16`; reconstruction did not silently alter that file.

Local execution logs are retained under `/tmp/mongodb-bookmarks-work/buildalong-*.log`, including assembly comparison, production/development verification and manual checks. These temporary machine-local paths are evidence locations, not public reader resources. Existing download/browser caches were reused. Reconstruction did not run inherited telemetry, modify the primary source, push to GitHub or perform cloud setup.

The rewritten [Google Doc tutorial](https://docs.google.com/document/d/1PsKBmGwGZt-PWeIgUWjp9XN6XXzOrwbvrAjt3HiLTZc) was saved on 26 October. Its readback matched the authored text exactly, including the code samples; all intended links and the application screenshot were present. The opening and representative component/test pages of its PDF export were visually inspected, and a text-bounds check found no text outside the content area across all 30 pages. Review status and publication prerequisites are kept in this report.

## Dependency audit snapshots

The **25 October 2026** audit reported four moderate findings in the Tailwind 3/PostCSS selector parser dependency chain, with no high or critical findings. On **26 October 2026**, a fresh `npm audit --json` in the primary checkout, using Node 24.22.1 / npm 11.19.1, exited successfully and reported **zero known vulnerabilities** across all severities. The report is retained locally at `/tmp/mongodb-bookmarks-work/buildalong-audit-20261026.json`. No audit fix, dependency upgrade or lockfile change was performed for this check.

These are dated advisory-service snapshots; neither result proves the absence of vulnerabilities or production readiness.

## Limits and publication follow-up

- Atlas provisioning, scoped database credentials, the approved network rule, index setup, Vercel deployment and authorized live CRUD were executed on 28 October, as recorded below. Codespaces setup and CRUD were exercised on 29 October after the two configuration fixes recorded below.
- Valid create, update and delete Server Action payloads were tested without credentials on 29 October across the four URLs of the recorded production deployment. All twelve requests hit the Vercel SSO gate without database changes; identical request bodies succeeded with an automation access credential. See the dated checkpoint below. There is no application-level authentication or per-user ownership.
- The verification wrapper uses POSIX process groups. The local macOS environment and the linked GitHub-hosted Ubuntu CI run were executed. Native Windows support is not implemented. WSL, Firefox, WebKit, a full accessibility review, load behavior and live database failover/recovery were not tested. Retry-cache reset still lacks direct recovery coverage. The 28 October checks below add behavioral coverage for tied-timestamp pagination and create-button disabling.
- The completed app is hosted in [Eronmmer/mongodb-bookmarks-tutorial](https://github.com/Eronmmer/mongodb-bookmarks-tutorial), a private repository created at the user's request. Public reader access remains pending. The [restricted deployment](https://mongodb-bookmarks-tutorial.vercel.app) is live. No upstream repository was modified.
- Before publication, obtain a technical review from a MongoDB Developer Advocate and an editorial review from Hugh Murray. Ask Jacob Payne whether the tutorial can be published on mongodb.com; DEV is the brief's alternative. These are pending editorial actions, not completed reviews or authorization to contact anyone.

## Reproduce

Use the repository's pinned Node version, then run:

```bash
npm ci
npx playwright install --with-deps chromium
npm run verify
npm run verify:dev
```

The test harness does not require an Atlas account or a local `.env` file. The local demo helper is disposable: stopping it deletes its data.

## Product cleanup and pagination, 28 October 2026

The app remains one bookmark list with no application sign-in, as requested. Removed the learning-demo badge, shared-list disclaimer, technology footer and URL placeholder from the interface. Replaced template metadata and favicon, removed the unused template social image/logos/font module, and updated package and Codespaces labels. Small optional/date labels now use a text color with a calculated 6.82:1 contrast ratio on white (previously 4.26:1); this is a targeted contrast check, not a full accessibility audit.

Older bookmarks are now reachable through timestamp/ObjectId cursor pagination. Each query fetches at most 101 records and displays 100, without a collection-wide count. `npm run db:setup` installs the matching compound index explicitly; it does not run as a side effect of page requests. Malformed cursors fall back to the newest page, and an empty older page offers a return link. Adding a bookmark from an older page returns to the newest list.

Create/edit fields are read-only while a submission is pending. Unconfirmed write results ask the user to refresh and check the list before retrying; the app does not promise that a failed acknowledgement means no write occurred. Separate form submissions are not idempotent.

Verification used `/tmp/bookmarks-polish-Fgk5jc`, a separate clone of `e47f17a` with the candidate patch applied and new files copied in. `npm ci` installed dependencies; no primary `.env`, database or build output was copied. Existing download caches were reused. On Node 24.22.1 / npm 11.19.1:

- `npm run verify` passed lint, TypeScript, eight unit tests, a production build without a URI, twelve healthy-database browser checks, one missing-URI check and one unreachable-database check.
- `npm run verify:dev` passed the same fourteen browser checks, for **28 executed browser checks across both runtimes**.
- New coverage includes all 205 records across three pages with mixed dates and tied timestamps, invalid/repeated cursor parameters, creation from an older page, empty older-page recovery, the installed index, pending create/edit fields, and malformed setup URI output that must not reveal synthetic credentials.
- A fresh audit on 28 October returned zero known vulnerabilities. No dependency upgrades were performed.
- Independent code review found a setup-URI constructor outside its error handler; it was moved inside the handler and regression tests added. The reviewer rechecked the repair and independently passed all eight unit tests, with no outstanding code findings.
- Two test-only timing issues were corrected: the create-form locator depended on a button label that changes while pending, and the pagination check read the prior page before navigation finished. The final successful runs use stable form identity and wait for the expected first record on each page.
- The last change after the full runs only darkened three small text labels. A fresh production build checked that revision before the screenshot was captured.

The refreshed article screenshot was captured from the running production build with two public documentation links in an isolated temporary database. The user's local preview database was not seeded, cleared or used by the tests. The preview remains available on port 3000.

The later cloud checkpoint below adds Atlas and Vercel execution evidence. Codespaces, exact valid-action replay, load testing and database failover were still unverified at this checkpoint; see the 29 October additions for subsequent coverage. Local verification alone does not establish hosted production readiness, data durability or deployment access control.

### Article reconstruction and hosted CI follow-up

The updated article pins application and supporting files to `07361f2c747a9e05be119c69f2582f59306fbabd`. A separate fresh reconstruction in `/tmp/mongodb-bookmarks-buildalong-20261028` started at the official template revision and assembled all eight core files from the article's replace/append blocks. They matched the pinned source modulo edge whitespace. Dependency installation, Chromium installation, lint, types, eight unit tests, the production build and the article's three browser checks in each runtime passed. Index setup was confirmed against the disposable database. The starter checkpoint returned HTTP 200 with its original heading and “Database connected” text; this checkpoint did not assess browser hydration. Ports 27029/3021 replaced the article defaults to protect existing previews, and all owned processes were stopped. Evidence is retained locally under `/tmp/mongodb-bookmarks-work/buildalong-oct28-*`.

The saved Google Doc readback exactly matched the updated article text. Its new screenshot is embedded, its source links and supporting-file commands use the new pin, and the rendered first page was visually checked. A text-bounds check found no overflow across the 31-page PDF export. No internal verification report was added to the article body.

[GitHub Actions run 40636914661](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/actions/runs/40636914661) passed on the exact application revision above. The dependency/browser installation, production verification and report upload steps all completed successfully. This adds hosted CI evidence, not Atlas, Codespaces or Vercel deployment evidence.

## Atlas, Vercel and article verification, 28 October 2026

Created the dedicated **Bookmarks Tutorial** Atlas project in the dashboard. The dashboard's Free-cluster form could not connect to the reCAPTCHA service; the supported Atlas CLI 1.59.3 user-account flow succeeded after authorization. An inventory check confirmed no existing cluster before an explicit `--tier M0` creation. The `bookmarks` cluster is Free M0, AWS Paris (`EU_WEST_3`), MongoDB 8.0.34, and reached `IDLE`. No paid resources or sample dataset were selected.

At this checkpoint, the `bookmarks_app` database user had only `readWrite` on `bookmarks_demo` (the former database name), scoped to the `bookmarks` cluster. The user approved the `0.0.0.0/0` network rule needed for this direct connection from Vercel Hobby's dynamic outbound addresses. This allows connection attempts from any IPv4 address; database credentials and TLS remain required. It is a deliberate network trade-off, not private networking.

Saved `MONGODB_URI` as a **Secret**, scoped only to Vercel Production. An initial credential appeared in a tool readback and was rotated in Atlas and Vercel before the Atlas-connected deployment. The replacement was not printed or committed. Local connection material is stored outside the repository with owner-only permissions.

The repository's setup script completed against Atlas with “Bookmark index is ready.” A separate driver read confirmed database `bookmarks_demo` (the name used for this historical check), an initially empty `bookmarks` collection, and index `bookmarks_newest_first` with `{ createdAt: -1, _id: -1 }`.

The Vercel project uses Hobby, Node.js 24.x, Fluid Compute and Paris (`cdg1`). **All Deployments** Vercel Authentication was saved before supplying working database credentials. The inspected settings had no protection exceptions, active share links or automation bypass secret. A normal account reauthentication was completed before redeployment.

The first deployment, `GhrFz28qDn6HrPB7DBebCKTsNSct`, verified building without a URI and loading the outage state after authentication. The Atlas-connected production deployment, [`4TGy2xEymzLimbFPX3BZvCNbnnJE`](https://vercel.com/erons/mongodb-bookmarks-tutorial/4TGy2xEymzLimbFPX3BZvCNbnnJE), reached Ready in 34 seconds. Both used `6aa3ad2f767fb3e900c645fc6662af7ef1c35221`, whose application code is identical to pinned revision `07361f2c747a9e05be119c69f2582f59306fbabd`. Vercel's Node major is verified; its exact minor/patch was not measured.

In authorized Chrome, created one disposable bookmark, reloaded to confirm persistence, changed its title and note, reloaded to confirm the edit, cancelled deletion, then confirmed deletion and reloaded to the empty state. The create form cleared after saving. A direct Atlas count after CRUD and the access probes below confirmed zero remaining records. The existing local preview database was untouched.

Unauthenticated requests used no cookies, authorization headers or deployment bypass credentials:

| URL type | Checked URL | GET | Multipart POST |
| --- | --- | --- | --- |
| Production | `https://mongodb-bookmarks-tutorial.vercel.app/` | 302 to Vercel SSO | 302 to Vercel SSO |
| Main-branch alias | `https://mongodb-bookmarks-tutorial-git-main-erons.vercel.app/` | 302 to Vercel SSO | 302 to Vercel SSO |
| Generated production | `https://mongodb-bookmarks-tutorial-q3k937g04-erons.vercel.app/` | 302 to Vercel SSO | 302 to Vercel SSO |
| Generated preview | `https://mongodb-bookmarks-tutorial-g8jfkrdmq-erons.vercel.app/` | 302 to Vercel SSO | 302 to Vercel SSO |

A separate Preview-environment deployment, `9RGYuPu2PBD422QU2jFkGyqG1fsL`, used the same source and reached Ready in 14 seconds with the existing build cache. Its authorized page displayed the expected missing-URI state: Production credentials were not shared with Preview. No separate Preview database was provisioned or CRUD-tested. Production still displayed its healthy empty state afterward.

The POST probes contained valid bookmark field values but omitted the hidden Server Action bindings, which the browser tool redacted. They establish redirects for those POST requests, **not an exact replay of a valid Server Action**. That stronger mutation check was still unverified at this checkpoint; the 29 October results below close it for the later recorded deployment.

The article prose was revised using the approved writing references. All 32 native code blocks (15 Shell and 17 TypeScript), 39 links, 35 titles/headings and the existing app screenshot were preserved. Independent readback comparison confirmed all code text exactly. Visual QA covered the exported 41-page PDF, including long TSX examples. Reader access to the private source and the brief's MongoDB technical/editorial reviews remain publication prerequisites.

Vercel's installation output included an ESLint 9 end-of-life warning and deprecated `glob` in the Tailwind/Sucrase development dependency chain. These need a coordinated tooling-maintenance review; they are separate from the dated zero-advisory audit result. This work did not force dependency upgrades or enable all install scripts.

## Self-contained tutorial reconstruction, 28 October 2026

Rebuilt the tutorial in `/tmp/bookmarks-selfcontained-acceptance-20261028` from a fresh clone of the public MongoDB template at `09278fa9369ce03c3e988156351655f87317ecf6`, on the reader branch `bookmarks`. During reconstruction, the official template was the only Git remote. No companion repository was fetched and no application files, lockfile, environment file, build output or installed dependencies were copied from the completed app. Existing npm, MongoDB binary and Chromium download caches were reused.

The article now prints the environment example, local database and index scripts, layout, Tailwind adjustment, stylesheet, favicon, isolated verification runner, Playwright configuration and GitHub Actions workflow. It retains the eight core application files and explains each replace/append step. The companion repository is an optional comparison source; no `git fetch companion` or cross-repository `git restore` is needed. The optional reference links still point to a private repository and need public access or a public destination before publication.

The first reconstruction exposed old transitive dependencies and a lint configuration mismatch inherited from the pinned template. The corrected instructions explicitly install `eslint-config-next@16.4.3` alongside Next.js 16.4.3 and run `npm update` within the declared ranges. A second fresh clone executed the corrected commands from the beginning. This generates a new lockfile for the reader to commit and subsequently reproduce with `npm ci`; it does not promise that future registry resolutions will be identical. No dependency or application-code change was made to the companion repository's main branch for this documentation update.

| Check against the corrected article | Result |
| --- | --- |
| Node 24.22.1 / npm 11.19.1; original template `npm ci`, exact dependency installs and `npm update` | Passed |
| Fresh dependency audit | Zero known findings on 28 October 2026 |
| Starter page connection checkpoint | HTTP 200, original heading and “Database connected” text |
| `npm run db:setup` | Compound bookmark index confirmed |
| Eight core files assembled from article blocks | Match the article and reference revision `7bbfb8b22facd05af7d3df3c5181c59d849cc324`, ignoring file-edge whitespace |
| ESLint, TypeScript and production build without a database URI | Passed |
| Article browser sample in production | 3 executed passes: healthy database, missing URI and unreachable database |
| Article browser sample in development | Same 3 checks passed |
| Additional comprehensive browser suite against the reconstructed app | 14 production and 14 development checks passed |
| Manual built-in-browser CRUD | Create, reload persistence, edit title/note, cancel deletion, confirm deletion and reload to empty state passed |
| Owned process cleanup | Temporary app/database processes stopped; existing preview on ports 3000/27028 untouched |

The comprehensive suite was a separate QA step: only the existing browser test fixture was temporarily copied into the reconstructed checkout after the article-only run. No application source or dependencies were copied. The article's smaller test file and runner were restored afterward. Its standalone runner has no `test:unit` prerequisite, and this reconstruction did not run the companion repository's eight unit tests. The 28 browser checks cover pagination, validation, pending forms, persistence and database failures; skipped scenarios are not counted as passes.

Manual database/app ports 27029/3022 replaced the article defaults 27028/3000 to protect the user's running preview. The local helper's documented port was restored on disk before the final checks. A copied Tailwind line had inherited mixed indentation from the template; the final verification source uses spaces and the trailing comma already printed in the article. No runtime logic changed.

Local evidence is retained under `/tmp/mongodb-bookmarks-work/selfcontained-acceptance-*`, including the initial article-only result, full-suite result and command logs. The canonical 43-code-block digest is `5a529c56f6822bf81c73c34d286711893d2dea74a63993e8cb66f7a06d3efbc9` (SHA-256 of the UTF-8 compact JSON array of exact code texts). A caption-only YAML label and internal assembly-metadata correction did not change those code texts.

After local acceptance, the reconstructed source was committed as `4606d3ca29481fca387280e6ac74125c390e706a` on `codex/self-contained-tutorial` and pushed to the existing private companion repository through a separately named verification remote. No push targeted MongoDB's repository. [GitHub Actions run 40786151207](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/actions/runs/40786151207) passed on that exact commit using the article's workflow on `ubuntu-latest`: dependency installation, Chromium installation, lint, types, production build, all three article browser scenarios and report upload succeeded. The workflow was dispatched manually because this verification branch is outside the example's `bookmarks`/`main` push filter. The reader's article test fixture was restored before this commit; the comprehensive QA fixture was not published on that branch.

The Google Doc was updated only after local and hosted acceptance passed. Independent readback comparison confirmed all 206 logical blocks, all 43 code samples including whitespace, all 38 hyperlinks, the 35 heading styles and the original screenshot. The 43 native code containers use Roboto Mono 9 pt and syntax colors; filenames and code identifiers have separate inline styling. Google Docs has no YAML language option, so the workflow uses its neutral `None` option with an explicit YAML caption and manual syntax colors. Visual review covered the title, setup, JavaScript helpers, CSS, SVG, verification runner and workflow in the refreshed 49-page PDF, plus the live editor. An all-page text-bounds check found no text outside the PDF pages. Thirty accidental inline-code styles on ordinary prose words were corrected without changing content. The final Markdown code fences match the same 43-code-block digest.

The self-contained path targets macOS/Linux. Codespaces, WSL and native Windows were not exercised by this reconstruction. Atlas/Vercel execution evidence remains the earlier hosted checkpoint above; the new local checks do not establish additional cloud coverage, exact valid-action replay, load behavior or database failover.


## Valid Server Action access checks, 29 October 2026

Tested production deployment `dpl_5YTxL3ht72rwD6Cf3kbqnz6VxGpk`, built from `61c34b911e5efc5fcf5a0cb28ca98553d736533a`. Vercel's deployment inspection mapped all four tested URLs to that same build before and after the requests. No deployment or application code changed during the test.

The test obtained the actual create/update/delete action references from this deployment's client bundle through Vercel's authenticated CLI. The matching Next.js 16.4.3 `encodeReply` serializer produced each multipart body once. These were constructed, working action requests, not HAR captures or guessed bindings. Each body was sent first without credentials, then with a temporary Vercel automation bypass credential as the positive control. The positives ran on the canonical production domain and had to return the action's success message **and** produce the expected MongoDB change before the corresponding negatives counted as valid.

| URL | Create without credentials | Update without credentials | Delete without credentials |
| --- | --- | --- | --- |
| `https://mongodb-bookmarks-tutorial.vercel.app/` | 302 to Vercel SSO | 302 to Vercel SSO | 302 to Vercel SSO |
| `https://mongodb-bookmarks-tutorial-erons.vercel.app/` | 302 to Vercel SSO | 302 to Vercel SSO | 302 to Vercel SSO |
| `https://mongodb-bookmarks-tutorial-git-main-erons.vercel.app/` | 302 to Vercel SSO | 302 to Vercel SSO | 302 to Vercel SSO |
| `https://mongodb-bookmarks-tutorial-32mc03upi-erons.vercel.app/` | 302 to Vercel SSO | 302 to Vercel SSO | 302 to Vercel SSO |

All negatives used ordinary Node HTTP requests with an explicit header allowlist: `Accept`, `Content-Type`, `Next-Action` and the destination's matching `Origin`. They contained no cookie, authorization header, bypass header or query credential; redirects were not followed. `vercel curl` was never used for a negative control. Request-body SHA-256 and byte length matched each action's successful positive control. The positive differed by the automation bypass header; this verifies authorized automation access, not a new browser SSO session.

Before, immediately after and two seconds after each negative, the test read the entire bookmark collection, ordered it by `_id`, preserved BSON types with canonical Extended JSON, sorted object keys and compared SHA-256 digests and document counts. All twelve negatives left both unchanged. The positive sequence created one uniquely tagged synthetic bookmark, changed its title/note while preserving `createdAt`, then deleted that same record. Both update and delete negatives targeted a record that existed at request time. The final collection digest and count matched the initial empty baseline. No personal bookmark or other database was modified.

Vercel Authentication stayed on **All Deployments**. The project had no automation bypass secret before testing. The CLI created one for this check; it was revoked afterward, and a request using that revoked secret returned the SSO redirect. The final secret count was again zero. Repository visibility remained **PRIVATE**.

Versioned sanitized evidence: [action requests and database digests](evidence/2026-10-29/live-action-requests.json), [deployment mapping and credential cleanup](evidence/2026-10-29/access-cleanup.json), and [reviewed helper hashes](evidence/2026-10-29/reviewed-harness-hashes.json). The exact executed helpers are retained locally under `/tmp/mongodb-bookmarks-work/action-proof/`; credentials and downloaded application resources are excluded from Git. Independent read-only review found no remaining issue in the revised helper or recorded results.

This closes the valid-action access check for these actions, URLs and deployment at the recorded time. It does not add application authentication or per-user ownership, test a credentialed Preview database, or establish protection for future deployments. The tutorial's application code and Google Doc examples did not need changes for this test.


## Codespaces setup and private preview, 29 October 2026

Created one 2-core Codespace in Europe West from the private companion repository at `61c34b911e5efc5fcf5a0cb28ca98553d736533a`. This exercised the completed reference app; it was not a second reconstruction of every article step from the public template. The existing $0 paid-usage budget remained unchanged. No Atlas credentials or personal/local database were used.

The first creation failed with error 1302 because the configured image `mcr.microsoft.com/devcontainers/javascript-node:1-24-bookworm` has no published manifest. Changing only the image tag to `24-bookworm` allowed the real container rebuild to finish. Its lifecycle log confirmed `postCreateCommand: npm ci` completed successfully, adding 470 packages and auditing 471 with zero reported vulnerabilities at that time. The runtime was Debian 12, Node 24.22.1, npm 11.19.1 and nvm 0.40.8. Explicit `nvm install` and `nvm use` selected the version in `.nvmrc`.

| Executed check | Result |
| --- | --- |
| Corrected image pull, container rebuild and automatic `npm ci` | Passed |
| Fresh explicit `npm ci` and Chromium/Linux dependency installation | Passed |
| ESLint, TypeScript and 8 unit tests | Passed |
| Production build with no database URI | Passed |
| Production browser checks with disposable MongoDB | 12 healthy, 1 missing URI, 1 unreachable database passed |
| Development browser checks with disposable MongoDB | The same 14 checks passed |
| Manual `.env.example`, local MongoDB helper and `db:setup` | Passed; compound index prepared |
| Actual private forwarded-port browser flow, after the origin fix below | Create, reload persistence, edit, reload persistence, confirm delete and final empty reload passed |
| Credential-free GET to the forwarded preview | 302 to GitHub's forwarded-port sign-in |
| Bounded proxy-origin regression | Two rejected origins and one successful identical-body control passed |
| Final config matrix, lint, TypeScript and development suite after the origin fix | Passed; all 14 browser checks passed again |

The manual preview exposed a second issue that localhost tests had not covered. GitHub forwarded `x-forwarded-host` as `weary-corpse-pg9qw4vr5qvh7757-3000.app.github.dev`, but rewrote Origin to `localhost:3000`; Next rejected the action with “Invalid Server Actions request.” The fix in `next.config.ts` adds exactly `localhost:3000` to `experimental.serverActions.allowedOrigins` only when both `NODE_ENV === "development"` and `CODESPACES === "true"`. There is no wildcard. The config matrix confirmed no extra allowed origins in ordinary development or production, including production with `CODESPACES=true`.

The origin regression obtained valid hidden create-action fields from the running dev server and serialized one multipart body. Every request retained the actual forwarded hostname. Origins `https://untrusted.example` and `http://localhost:3001` each returned HTTP 500 with the explicit invalid-action error and left the complete sorted JSON collection snapshot unchanged. Changing only Origin to `http://localhost:3000` returned 200 and created exactly one synthetic bookmark; cleanup deleted that owned record. This is a proxy-origin check, not application authentication. GitHub's private-port gate supplies preview access control.

The editor's rebuild/forwarding commands sometimes had no visible effect, and both its port list and the CLI port list stayed empty. Their cause was not established. The official CLI rebuilt the existing Codespace successfully; the preview address obtained from Codespace environment variables worked through GitHub sign-in despite the empty list. Port 3000 was explicitly set to private, and a separate credential-free request confirmed the login redirect. No public port was enabled.

Hashes of the locally delivered files matching the two tested patches are recorded in [the source hash manifest](evidence/2026-10-29/codespaces-source-hashes.json). The hashes were computed from the delivered files, not measured again on the stopped remote container. Local command logs, the origin-check helper and screenshots are retained under `/tmp/mongodb-bookmarks-work/codespaces-*`. Independent review found no remaining issue in the scoped fix or origin-check method. The article continues to document its tested macOS/Linux build path; these companion-repository changes do not alter its application code samples or Google Doc formatting.

References: [Next.js Server Action origin checks](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions), [GitHub port forwarding](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace).

The owned Codespace was stopped after the final tests; GitHub confirmed the stopped state. No test bookmark remained. The private repository and existing $0 paid-usage budget were retained. [The captured command summary](evidence/2026-10-29/codespaces-test-summary.txt) records the final checks.

## Tutorial screenshot replacement, 29 October 2026

Replaced `docs/images/bookmarks-desktop.png` with a genuine lossless PNG captured from the running production app. This file is a documentation asset referenced by `docs/tutorial.md`; the application does not import it or require it at runtime. The previous file was a 1280 × 720 JPEG despite its `.png` extension.

The new capture is 3000 × 1692 pixels (232,224 bytes), rendered in an isolated headless Chromium 149.0.7827.55 session at a 1024 × 680 CSS-pixel viewport and device scale factor 3. A 1000 × 564 CSS-pixel crop includes the full header, form and both bookmark cards with 12 pixels of surrounding space. No app code, CSS or rendered content was altered for the capture. The user explicitly approved this capture method because the built-in browser screenshot tool outputs JPEG.

The production preview used two public documentation bookmarks in a disposable loopback MongoDB database, separate from the user's preview and Atlas. Nineteen relevant source, configuration and dependency files matched `dc8431af9794b024b017b1d8a505198de8dc7259`; the reused build's only configuration difference was the Codespaces development-only origin setting, which is inactive in production.

Replaced only the opening screenshot in the Google Doc. Native readback confirmed that the full document body, including all prose, code and paragraph/text styles, was unchanged after normalizing the new image object ID. The exported PDF still has 49 pages and embeds the image at 2048 × 1155 pixels with lossless image encoding, approximately 315 pixels per inch at its 6.5-inch display width. The first page was rendered and visually checked for legibility and layout. The 3000-pixel original remains in the repository for publication.

PNG SHA-256: `d361dcedfddc6d10a84530c6edc3de75be5d84023f182a0849cabdfb94d15d95`. Capture script and measurements are retained locally under `/tmp/mongodb-bookmarks-work/capture-publication-screenshot.mjs` and `/tmp/mongodb-bookmarks-work/screenshot-retake-evidence.json`.

The isolated preview and temporary database stopped successfully afterward; ports 3033 and 52090 were closed. Independent visual review of the updated first page found no clipping, distortion or overlap.

## Staged tutorial rewrite and exact reconstruction, 30 October 2026

The revised article starts from public template commit `09278fa9369ce03c3e988156351655f87317ecf6`. It introduces a connected starter, a working create/read page, full CRUD, and finally pagination with its index. The companion reference was frozen at `d90498b7adf1d3c137eedaa6b16dc35fcb371a4d`. No application behavior or production configuration changed in this editorial rewrite.

Two independent local reconstructions served different purposes. The first tested each intermediate stage with owned disposable MongoDB data. The second cloned the public template again, installed dependencies afresh, and assembled files from the article's actual write/append/replace instructions. It did not copy the finished app from the private repository. Existing npm, Chromium and MongoDB binary download caches were reused.

| Executed check | Result |
| --- | --- |
| Connected starter in development | “Database connected” visible |
| Create/read stage | Lint, types, production build, invalid-input rejection, UI create/reload, newest-100 cap and outages passed |
| Full CRUD stage | UI create, reload, edit all fields, reload, cancel deletion and confirm deletion passed |
| Timestamp behavior | Created time preserved and updated time advanced |
| Pagination stage | 101 equal-timestamp records returned as 100 + 1, newest-page navigation and malformed-token fallback passed |
| Compound index | Descending `createdAt` / `_id` index present |
| Exact article dependency and Chromium installation | Passed |
| Exact article `npm run verify` | Lint, types, URI-free production build and all three browser scenarios passed |
| Exact article `npm run verify:dev` | Healthy CRUD, missing URI and unreachable database scenarios passed |

The compact article test now creates and edits through the actual form before checking persistence, cancellation and deletion. It no longer relies on a seeded record for its only healthy scenario. There are three executed browser scenarios per runtime. Scenario-specific skips are not additional passes. The companion's larger regression suite remains separate evidence.

Independent assembly review repaired a missing delete-action import, added the required Codespaces-only request-origin configuration, restored the Chromium installation step, and checked replacement boundaries. Source comparisons found no behavioral differences from the frozen application. Publication snippets omit private guidance comments and the companion-only agent setting. The article no longer contains links to files in the private companion repository.

Evidence: [checkpoint results](evidence/2026-10-30/tutorial-checkpoints.json), [exact reconstruction report](evidence/2026-10-30/article-exact-report.json), [source hashes](evidence/2026-10-30/tutorial-source-hashes.json), and [article digest](evidence/2026-10-30/tutorial-reconstruction.json). Raw local logs remain under `/tmp/mongodb-bookmarks-rewrite/`. The existing user-owned preview and database were left running untouched.

The exact reader reconstruction was committed on the separate private branch `codex/tutorial-rewrite-verification` at `8a655d6f2b3dba43d429c9cbe2164bc464457a7c`. [GitHub Actions run 40991750697](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/actions/runs/40991750697) passed the article's workflow on Ubuntu 24.04: locked installation, Chromium installation, lint, types, production build, healthy CRUD persistence, both unavailable-database scenarios and report upload. The workflow was dispatched explicitly because the verification branch is outside its `bookmarks`/`main` push filter. `.env` was ignored and absent from the commit. No push targeted MongoDB's upstream repository. See [the hosted result](evidence/2026-10-30/hosted-reader-ci.json).

### Public-template Codespaces route

Created a new 2-core Codespace from the public MongoDB template. The prebuild initially contained an older checkout and Ubuntu 20.04 with Node 22. The documented fetch and pinned branch switch, followed by the Node 24 Bookworm devcontainer rebuild, produced Debian 12, Node 24.22.1 and npm 11.19.1. The container UI appeared delayed, so the official CLI rebuild command was also issued inside the remote terminal. The successful rebuild cannot be attributed exclusively to either trigger.

All 22 cumulative final app/support/test files matched the stage payload checksums remotely. The article's dependency installation, Chromium/Linux dependencies, production verification and development verification passed. The actual `db:local` helper ran MongoDB 8.2.6 on port 27028, and `db:setup` prepared the index. The final dependency audit output reported zero known vulnerabilities at that time, which is a dated result rather than a security guarantee.

The Ports panel showed port 3000 as **Private**. Browser create, reload, edit, reload, delete and empty reload passed through the actual forwarded URL using the documented `--hostname 127.0.0.1` command. The container JSON forwards the port but does not itself set its visibility, so the article explicitly tells readers to check Private. No extra `allowedDevOrigins` setting was necessary.

An anonymous GET returned 302. An anonymous POST containing a valid serialized create-action body returned 401 and left the complete bookmark snapshot unchanged. The same body sent directly to the owned app with the expected proxy origin returned 200 and created one fixture, establishing payload validity. Origins `untrusted.example` and `localhost:3001` were rejected with no data change. The `localhost:3000` allowance was present only in Codespaces development, never in production or ordinary local development.

The database was empty after cleanup. The owned Codespace was stopped, its dedicated browser tabs closed, the existing $0 paid-usage budget retained, and the companion repository confirmed private. [The Codespaces report](evidence/2026-10-30/codespaces-report.md) records the exact route, outcomes and limits. This was a public-template reconstruction of the final cumulative source, while intermediate stages were tested locally. It does not replace the separate, dated Atlas/Vercel evidence above.

### Google Doc and visual review

The existing Google Doc was updated in place after the local reconstruction passed. All 261 logical blocks and all 55 code samples match the reviewed source exactly, including whitespace. Native readback confirms 55 code containers, both images, all 23 unique intended link destinations, no private-repository links, and no prose semicolons. The original high-resolution hero image was preserved. Filenames and inline code retain separate styling, and native code uses Roboto Mono 9 pt with syntax colors and language labels. YAML retains the neutral native option with an explicit YAML caption because Google Docs does not offer YAML in its language menu.

Added a direct screenshot of the real edit card, captured from the isolated production app with synthetic data. The lossless PNG is 1872 × 1116 pixels at device scale factor 3, with 8 CSS pixels of surrounding space and no retouching. It is a documentation asset and is not required at runtime. Its source and SHA-256 are recorded in [the capture metadata](evidence/2026-10-30/edit-card-capture.json).

The final PDF has 55 pages. Independent visual inspection covered long component continuations, the edit image, pagination/index, tests, workflow and deployment pages. The opening and setup were also inspected. An initial font reset was corrected, and the short repository-push command block was kept together. The final export has no empty pages or text outside the page bounds. These checks are a layout review, not a publisher's editorial approval. See [document QA](evidence/2026-10-30/document-qa.json) and [independent visual review](evidence/2026-10-30/independent-document-review.json).

The source repository remains private. Atlas/Vercel deployment behavior, cross-browser coverage beyond Chromium, native Windows, load and failover were not newly tested by this rewrite. Prior live evidence remains dated and scoped to its recorded deployments. Publication still needs the author's review and MongoDB's technical/editorial review.

## Shortened article with companion source links, 30 October 2026

The owner approved replacing long supporting-code listings with links to the eventual public repository. This supersedes the earlier requirement that every required file appear inline. The article now has 36 code blocks and 488 displayed code lines, down from 55 blocks and approximately 1,711 lines in the live draft. It keeps the core MongoDB operations, connection helper, Server Action flow, runnable milestones, a complete CRUD test excerpt and deployment instructions. Supporting UI, styling, configuration and test infrastructure are linked where needed. Excerpts are explicitly labelled, and each copied file has a stated destination.

All 18 source-file links use immutable commits. Common and final files point to the previously verified reader source at `8a655d6f2b3dba43d429c9cbe2164bc464457a7c`, retained by `tutorial-v1`. The first-save page points to `88d9af5ac809d4d5cf778435d07a9af63077f793`, retained by `tutorial-first-bookmark-v1`. The latter is a separate runnable create/read snapshot with its corresponding browser tests. Both tags were pushed to the existing private companion repository. No repository visibility or production application setting changed. Public access to these files is required before publishing the article.

An independent reconstruction cloned the public MongoDB template at `09278fa9369ce03c3e988156351655f87317ecf6`, followed the article's inline operations and exact linked files, installed dependencies afresh, and checked all four milestones. The starter connected in development. Create/read, full CRUD and pagination passed production lint, type checks, builds, browser interactions and unavailable-database checks. The exact reader commands `npx playwright install --with-deps chromium`, `npm run verify` and `npm run verify:dev` passed. Existing dependency/browser/MongoDB download caches were reused.

All seven excerpts matched their linked source after normalizing indentation, blank lines and full-line comments. Comparison of 24 application, configuration and package-definition files found no executable difference from the previously verified final source. Fresh `npm update` changed one transitive dependency, `electron-to-chromium` from 1.5.467 to 1.5.468. The resulting lockfile passed the new local checks. Earlier hosted CI evidence used its earlier lockfile. All source links also resolved through the authenticated GitHub API, which does not establish anonymous availability while the repository is private.

The Google Doc was updated only after these checks passed. Readback matched all 219 logical blocks and 36 native code blocks exactly, with both existing image IDs preserved. The final PDF has 28 pages, compared with 55 previously. Its native language labels, syntax colors, code fonts, inline-code styling and links were checked. Short code excerpts were kept together, and longer blocks retain several opening lines before a page break. Both screenshots retain their previous embedded dimensions and pixels. Independent visual review found no blank pages, clipping or misplaced language labels.

Evidence: [reconstruction report](evidence/2026-10-30/shortened-tutorial-verification.json), [linked-source and excerpt audit](evidence/2026-10-30/shortened-source-audit.json), [source comparison](evidence/2026-10-30/shortened-source-comparison.json), [authenticated link checks](evidence/2026-10-30/shortened-github-links.json) and [document review](evidence/2026-10-30/shortened-document-qa.json). The exact Markdown SHA-256 is `3dfb7c24cfba6413138b046c72d05e0fbee53edd1cb0eed17c63b0baaf7fd2d2`. Raw logs, the reconstruction ledger and PDF exports remain under `/tmp/mongodb-bookmarks-shortening/`.

This edit did not rerun Codespaces, Atlas, Vercel or hosted Server Action access tests. Those remain the dated checks recorded above. The temporary-database manual helper was linked unchanged, while the new checks used isolated temporary databases on random loopback ports. Publication still needs the owner's review, public companion access and the publisher's review.
