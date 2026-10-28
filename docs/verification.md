# Bookmark app verification

Latest application revision: `07361f2c747a9e05be119c69f2582f59306fbabd`, verified on 28 October 2026. Earlier runs below retain their original dates and scope.

The latest tutorial setup is self-contained. The reconstruction at the end of this report supersedes the earlier instructions that fetched supporting files from the companion repository; those earlier runs remain historical evidence.

Full-suite verification was performed on 25 October 2026. Application and verification code: `32a6c7ce838489f7f9fb2b8f591f2b185904adfe`. Subsequent evidence/document changes do not change that runtime. A separate build-along reconstruction was verified on 26 October 2026, as recorded below.

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

- Atlas provisioning, scoped database credentials, the approved network rule, index setup, Vercel deployment and authorized live CRUD were executed on 28 October, as recorded below. Codespaces remains untested.
- Production, main-branch and generated deployment URLs returned Vercel authentication redirects for unauthenticated GET and multipart POST probes. An exact valid Server Action replay with authentication/bypass data removed remains unverified: the browser tool redacted its hidden action bindings. A malformed POST failing validation would not establish protection. There is no application-level authentication or per-user ownership.
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

The later cloud checkpoint below adds Atlas and Vercel execution evidence. Codespaces, exact valid-action replay, load testing and database failover remain unverified. Local verification alone does not establish hosted production readiness, data durability or deployment access control.

### Article reconstruction and hosted CI follow-up

The updated article pins application and supporting files to `07361f2c747a9e05be119c69f2582f59306fbabd`. A separate fresh reconstruction in `/tmp/mongodb-bookmarks-buildalong-20261028` started at the official template revision and assembled all eight core files from the article's replace/append blocks. They matched the pinned source modulo edge whitespace. Dependency installation, Chromium installation, lint, types, eight unit tests, the production build and the article's three browser checks in each runtime passed. Index setup was confirmed against the disposable database. The starter checkpoint returned HTTP 200 with its original heading and “Database connected” text; this checkpoint did not assess browser hydration. Ports 27029/3021 replaced the article defaults to protect existing previews, and all owned processes were stopped. Evidence is retained locally under `/tmp/mongodb-bookmarks-work/buildalong-oct28-*`.

The saved Google Doc readback exactly matched the updated article text. Its new screenshot is embedded, its source links and supporting-file commands use the new pin, and the rendered first page was visually checked. A text-bounds check found no overflow across the 31-page PDF export. No internal verification report was added to the article body.

[GitHub Actions run 40636914661](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/actions/runs/40636914661) passed on the exact application revision above. The dependency/browser installation, production verification and report upload steps all completed successfully. This adds hosted CI evidence, not Atlas, Codespaces or Vercel deployment evidence.

## Atlas, Vercel and article verification, 28 October 2026

Created the dedicated **Bookmarks Tutorial** Atlas project in the dashboard. The dashboard's Free-cluster form could not connect to the reCAPTCHA service; the supported Atlas CLI 1.59.3 user-account flow succeeded after authorization. An inventory check confirmed no existing cluster before an explicit `--tier M0` creation. The `bookmarks` cluster is Free M0, AWS Paris (`EU_WEST_3`), MongoDB 8.0.34, and reached `IDLE`. No paid resources or sample dataset were selected.

The `bookmarks_app` database user has only `readWrite` on `bookmarks_demo`, scoped to the `bookmarks` cluster. The user approved the `0.0.0.0/0` network rule needed for this direct connection from Vercel Hobby's dynamic outbound addresses. This allows connection attempts from any IPv4 address; database credentials and TLS remain required. It is a deliberate network trade-off, not private networking.

Saved `MONGODB_URI` as a **Secret**, scoped only to Vercel Production. An initial credential appeared in a tool readback and was rotated in Atlas and Vercel before the Atlas-connected deployment. The replacement was not printed or committed. Local connection material is stored outside the repository with owner-only permissions.

The repository's setup script completed against Atlas with “Bookmark index is ready.” A separate driver read confirmed database `bookmarks_demo`, an initially empty `bookmarks` collection, and index `bookmarks_newest_first` with `{ createdAt: -1, _id: -1 }`.

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

The POST probes contained valid bookmark field values but omitted the hidden Server Action bindings, which the browser tool redacted. They establish redirects for those POST requests, **not an exact replay of a valid Server Action**. That stronger mutation check remains unverified.

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
