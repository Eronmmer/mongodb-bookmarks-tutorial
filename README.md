# Bookmarks with Next.js and MongoDB

An app for saving, listing, editing and deleting bookmarks with Next.js App Router, React, TypeScript and the official MongoDB driver. Each bookmark has a title, an HTTP(S) URL and an optional note.

The app uses one bookmark list, with no application sign-in or per-user records. Keep hosted access restricted to the people who should be able to read and change that list. The tutorial uses public sample links.

See the [verification report](docs/verification.md) for the executed checks and their limits. The [self-contained tutorial](docs/tutorial.md) starts from MongoDB's public template and includes all the code and commands needed to build the app. This repository is an optional reference. Atlas connectivity and index setup, Vercel deployment and live CRUD have been checked. On 29 October 2026, valid create, update and delete Server Action requests were blocked without credentials across all four URLs of the tested production deployment; database contents stayed unchanged.

## Source repository

The completed app is in [Eronmmer/mongodb-bookmarks-tutorial](https://github.com/Eronmmer/mongodb-bookmarks-tutorial), a private repository. Cloning this reference implementation requires access; following the tutorial does not. Its optional reference links need public access or a public destination before publication. The editable [Google Doc](https://docs.google.com/document/d/1PsKBmGwGZt-PWeIgUWjp9XN6XXzOrwbvrAjt3HiLTZc) and Markdown tutorial contain the build instructions.

```bash
git clone https://github.com/Eronmmer/mongodb-bookmarks-tutorial.git
cd mongodb-bookmarks-tutorial
```

## Run locally

Use Node.js **24.22.1**, recorded in `.nvmrc`. With nvm:

```bash
nvm install
nvm use
node --version
npm ci
cp .env.example .env
```

The example selects:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27028/bookmark_app
```

Start the database in one terminal and leave it running:

```bash
npm run db:local
```

The helper downloads and starts a real MongoDB **8.2.6** process using `mongodb-memory-server-core`. It needs network access for the first download and uses temporary storage. Stopping it loses the demo data. It is not an Atlas account or a mock database.

In another terminal:

```bash
npm run db:setup
npm run dev -- --hostname 127.0.0.1
```

`db:setup` creates the `{ createdAt: -1, _id: -1 }` index used by bookmark ordering and pagination. Run it once for each database (and again after restarting the disposable helper); repeating it is safe. The database user needs permission to create indexes. For a hosted database, run this command from a trusted environment with the destination `MONGODB_URI` before deploying.

Open <http://127.0.0.1:3000>. Add a sample bookmark, refresh to read it again, edit its note, then delete it. Stop the app and database with Ctrl+C. Use your own MongoDB instance or Atlas for persistent data.

## Use Atlas instead

1. Create/select an Atlas project and cluster. Create a database user with only the demo database privileges it needs, such as `readWrite` on `bookmark_app`. This is separate from your Atlas website account.
2. Add the public outbound IP of the machine running Node to the project's IP access list. A browser's address is not necessarily the app server's address. Home addresses can change. A restarted Codespace uses a new VM; recheck its outbound address rather than assuming a stable IP.
3. Choose Connect → Drivers → Node.js. Copy the URI, replace credential placeholders, percent-encode reserved characters in credentials, and select `bookmark_app` as the database.
4. Replace `MONGODB_URI` in `.env`. Run `npm run db:setup` for that database before starting or restarting the app. Do not run `db:local` for this path. Keep the URI out of Git, screenshots and logs.

Sources: [Atlas connection prerequisites](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/), [IP access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/), [URI encoding](https://www.mongodb.com/docs/v8.3/reference/connection-string-formats/).

## Verify the app

The verification helper uses POSIX process groups and has been tested on macOS and Ubuntu. WSL has not been tested. Native Windows execution is not implemented.

Install Chromium once, including operating-system dependencies where needed:

```bash
npx playwright install --with-deps chromium
npm run verify
```

`verify` runs lint, TypeScript checks, unit tests, a production build without a database URI, and browser checks against isolated temporary MongoDB data. It also checks missing-URI and unreachable-database states. Exercise development CRUD with:

```bash
npm run verify:dev
```

Use these wrappers for the full suite. Never point destructive tests at an Atlas database, shared demo database, or URI copied from `.env`. Tests need disposable data. `test:e2e` is a lower-level entry point; inspect its configuration before using it directly.

These commands describe the checks, not evidence that they passed on your machine. Local results are recorded separately. The [first hosted GitHub Actions run](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/actions/runs/40238792328) passed `verify` on commit `1b7f100`, including six unit tests and twelve production browser checks.

## Code map

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Dynamic Node.js page, list, empty and database-error states |
| `app/actions.ts` | Server Actions, validation, mutation feedback and refresh |
| `components/bookmark-form.tsx` | Create form and field errors |
| `components/bookmark-item.tsx` | Display, edit and delete controls |
| `db/bookmarks.ts` | Fixed-field MongoDB CRUD and browser-safe values |
| `lib/mongodb.ts` | Lazy shared client and retry after connection failure |
| `lib/bookmark-validation.ts` | String lengths, HTTP(S) URLs and identifier checks |
| `EDD.md` | Document model and database behavior |
| `scripts/verify.mjs` | Isolated verification orchestration |
| `docs/tutorial.md` | Self-contained build from the public MongoDB template |

The list shows 100 bookmarks per page. “Older bookmarks” uses a validated timestamp/ID cursor, and “Back to newest” returns to recent links. Reads request at most 101 records to detect another page without counting the entire collection. The MongoDB driver generates identifiers; the server generates timestamps. Validation is application code, not a collection-level JSON schema. There is no user ownership or application authentication. Fields are read-only while a save is pending. A write whose result cannot be confirmed asks the user to refresh and check before retrying.

## Codespaces

The devcontainer selects Node 24, runs `npm ci` and configures port 3000 for forwarding. It does not create Atlas resources, supply credentials, start the database/app or install Playwright browsers. Follow setup above and keep the forwarded port private. The corrected configuration was exercised in a GitHub Codespace on 29 October 2026; see the dated verification report. See [GitHub's access rules](https://docs.github.com/en/codespaces/reference/security-in-github-codespaces).

GitHub's port proxy can rewrite a browser request's Origin to `localhost:3000` while retaining the public forwarded hostname. `next.config.ts` permits that exact origin only when running `next dev` inside Codespaces (`CODESPACES=true`). It does not add an origin exception to ordinary local development or production. Use port 3000 for this setup and keep its visibility **Private**. This setting handles the proxy header mismatch; it does not authenticate visitors.

## Deploy a restricted demo

Import the [completed bookmarks repository](https://github.com/Eronmmer/mongodb-bookmarks-tutorial) using a Vercel account with access to the private repository. The restricted [Vercel deployment](https://mongodb-bookmarks-tutorial.vercel.app) connects to Atlas; create, reload, edit and delete were verified on 28 October 2026. The original template's Deploy button targets the original template, not this app.

Before deploying working CRUD, configure Vercel Authentication with **All Deployments**, ideally as the team default before project creation. Otherwise configure the project before supplying working database credentials. Under Project → Settings → Deployment Protection, select All Deployments and verify production domains, preview domains and generated URLs are covered. Standard Protection leaves production domains public. Review exceptions and share-link bypasses. All Deployments with Vercel Authentication is available on every plan as of [9 September 2026](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan).

Set server-only `MONGODB_URI` at project level for Production and, if used, Preview. Never use `NEXT_PUBLIC_MONGODB_URI`. Development scope applies to local tooling, not deployed environments. Redeploy after changing variables. Prefer separate demo/preview databases.

Vercel Functions and builds use dynamic outbound IPs by default. Static IPs supplies an allowlisting option on Pro/Enterprise; build routing is separately configurable. The app domain's resolved IP is not its outbound address. If you deliberately choose Atlas `0.0.0.0/0` for this learning setup, understand that it permits database connection attempts from anywhere and removes the IP restriction. Strong database-scoped credentials remain required; prefer restricted outbound networking where available. The Vercel login gate does not protect the database port.

Before sharing, use a fresh unauthenticated browser context to check every URL type. Confirm visitors get the Vercel login gate instead of bookmark data. Replay an actual valid Server Action POST from the same deployment without authentication or bypass cookies/headers; verify it is gated and changes no database record. A malformed request failing validation does not prove protection. On 29 October 2026, create, update and delete payloads succeeded with a temporary automation access credential. The same serialized request bodies, sent without credentials to the production domains, main-branch alias and generated deployment URL, all redirected to Vercel SSO and left the database unchanged. The test credential was revoked afterward. These results apply to the recorded deployment, not future deployments; see the verification report for its identity and evidence.

Sources: [deployment protection](https://vercel.com/docs/deployment-protection), [environment scopes](https://vercel.com/docs/environment-variables), [outbound IPs](https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address), [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables).

## Provenance and dependency limits

Adapted from [MongoDB's official template at commit `09278fa`](https://github.com/mongodb-developer/nextjs-template-mongodb/tree/09278fa9369ce03c3e988156351655f87317ecf6). The original licence is retained in `LICENSE`. This adaptation adds bookmarks CRUD and isolated verification; it does not imply official MongoDB authorship or endorsement of the adaptation.

The refreshed lockfile resolves Next.js 16.4.3, React 19.2.7, MongoDB driver 7.5.0 and Playwright 1.61.1. Use `npm ci` to reproduce it. The 28 October 2026 audit reported zero known vulnerabilities. Earlier audit results and remaining execution limits are recorded in `docs/verification.md`; advisory results can change.

Vercel installation also reported an ESLint 9 end-of-life warning and a deprecated `glob` dependency in the Tailwind chain. These are development-tool maintenance follow-ups, separate from vulnerability-audit findings.
