# Bookmarks with Next.js and MongoDB

A learning app for saving, listing, editing and deleting bookmarks with Next.js App Router, React, TypeScript and the official MongoDB driver. Each bookmark has a title, an HTTP(S) URL and an optional note.

This is a **shared learning demo**. There are no application accounts or per-user records: everyone with access can see and change the same list. Use sample links, never private information. Restrict any hosted deployment before enabling writes.

See the [verification report](docs/verification.md) for the executed clean-checkout checks and their limits. The [working tutorial draft](https://docs.google.com/document/d/1PsKBmGwGZt-PWeIgUWjp9XN6XXzOrwbvrAjt3HiLTZc) was prepared after local verification; the source repository is private, and live cloud checks remain pending.

## Source repository

The completed app is in [Eronmmer/mongodb-bookmarks-tutorial](https://github.com/Eronmmer/mongodb-bookmarks-tutorial), a private repository. Cloning requires access to that repository. Public reader access must be arranged before the tutorial is published.

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
MONGODB_URI=mongodb://127.0.0.1:27028/bookmarks_demo
```

Start the database in one terminal and leave it running:

```bash
npm run db:local
```

The helper downloads and starts a real MongoDB **8.2.6** process using `mongodb-memory-server-core`. It needs network access for the first download and uses temporary storage. Stopping it loses the demo data. It is not an Atlas account or a mock database.

In another terminal:

```bash
npm run dev -- --hostname 127.0.0.1
```

Open <http://127.0.0.1:3000>. Add a sample bookmark, refresh to read it again, edit its note, then delete it. Stop the app and database with Ctrl+C. Use your own MongoDB instance or Atlas for persistent data.

## Use Atlas instead

1. Create/select an Atlas project and cluster. Create a database user with only the demo database privileges it needs, such as `readWrite` on `bookmarks_demo`. This is separate from your Atlas website account.
2. Add the public outbound IP of the machine running Node to the project's IP access list. A browser's address is not necessarily the app server's address. Home addresses can change. A restarted Codespace uses a new VM; recheck its outbound address rather than assuming a stable IP.
3. Choose Connect → Drivers → Node.js. Copy the URI, replace credential placeholders, percent-encode reserved characters in credentials, and select `bookmarks_demo` as the database.
4. Replace `MONGODB_URI` in `.env` and restart the app. Do not run `db:local` for this path. Keep the URI out of Git, screenshots and logs.

Sources: [Atlas connection prerequisites](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/), [IP access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/), [URI encoding](https://www.mongodb.com/docs/v8.3/reference/connection-string-formats/).

## Verify the app

The verification helper supports macOS, Linux and WSL; it uses POSIX process groups to clean up the app and its workers. Native Windows execution has not been implemented or tested.

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

These commands describe the checks, not evidence that they passed on your machine. Local results are recorded separately. GitHub Actions is configured to run `verify`; this is not proof of a successful hosted CI run.

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
| `docs/tutorial-outline.md` | Planned tutorial structure |

The list shows the 100 newest bookmarks and discloses when more exist. The MongoDB driver generates identifiers; the server generates timestamps. Validation is application code, not a collection-level JSON schema. There is no user ownership, pagination or application authentication.

## Codespaces

The devcontainer selects Node 24, runs `npm ci` and configures port 3000 for forwarding. It does not create Atlas resources, supply credentials, start the database/app or install Playwright browsers. Follow setup above and keep the forwarded port private. The configuration has not been validated by creating a Codespace. See [GitHub's access rules](https://docs.github.com/en/codespaces/reference/security-in-github-codespaces).

## Deploy a restricted demo

Import the [completed bookmarks repository](https://github.com/Eronmmer/mongodb-bookmarks-tutorial) using a Vercel account with access to the private repository. No deployment URL has been created. The original template's Deploy button targets the original template, not this app.

Before deploying working CRUD, configure Vercel Authentication with **All Deployments**, ideally as the team default before project creation. Otherwise configure the project before supplying working database credentials. Under Security → Deployment Protection, select All Deployments and verify production domains, preview domains and generated URLs are covered. Standard Protection leaves production domains public. Review exceptions and share-link bypasses. All Deployments with Vercel Authentication is available on every plan as of [9 September 2026](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan).

Set server-only `MONGODB_URI` at project level for Production and, if used, Preview. Never use `NEXT_PUBLIC_MONGODB_URI`. Development scope applies to local tooling, not deployed environments. Redeploy after changing variables. Prefer separate demo/preview databases.

Vercel Functions and builds use dynamic outbound IPs by default. Static IPs supplies an allowlisting option on Pro/Enterprise; build routing is separately configurable. The app domain's resolved IP is not its outbound address. If you deliberately choose Atlas `0.0.0.0/0` for this learning setup, understand that it permits database connection attempts from anywhere and removes the IP restriction. Strong database-scoped credentials remain required; prefer restricted outbound networking where available. The Vercel login gate does not protect the database port.

Before sharing, use a fresh unauthenticated browser context to check every URL type. Confirm visitors get the Vercel login gate instead of bookmark data. Replay an actual valid Server Action POST from the same deployment without authentication or bypass cookies/headers; verify it is gated and changes no database record. A malformed request failing validation does not prove protection. Confirm authorized CRUD separately. These hosted checks remain unperformed; local tests cannot prove Vercel protection.

Sources: [deployment protection](https://vercel.com/docs/deployment-protection), [environment scopes](https://vercel.com/docs/environment-variables), [outbound IPs](https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address), [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables).

## Provenance and dependency limits

Adapted from [MongoDB's official template at commit `09278fa`](https://github.com/mongodb-developer/nextjs-template-mongodb/tree/09278fa9369ce03c3e988156351655f87317ecf6). The original licence is retained in `LICENSE`. This adaptation adds bookmarks CRUD and isolated verification; it does not imply official MongoDB authorship or endorsement of the adaptation.

The refreshed lockfile resolves Next.js 16.4.3, React 19.2.7, MongoDB driver 7.5.0 and Playwright 1.61.1. Use `npm ci` to reproduce it. Four moderate findings remain in the Tailwind 3 parser dependency chain in the recorded audit snapshot; this is not a zero-advisory claim. Advisory databases change, so review a fresh audit when updating dependencies.
