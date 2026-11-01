# AGENTS.md

## Scope and commands

This is the reader version of the MongoDB bookmark tutorial. Use Node.js 24 LTS from `.nvmrc`. Keep TypeScript 5 and Tailwind CSS 3 unless a separate migration is requested.

From the repository root:

```bash
npm ci
npx playwright install --with-deps chromium
npm run verify
npm run verify:dev
```

`verify` runs lint, TypeScript, a production build and the article’s browser tests. `verify:dev` runs those browser checks in development mode. The runner owns a disposable MongoDB 9.0.4 instance and Next.js processes; do not point the tests at Atlas or run Playwright directly. This reader version has no unit test suite.

For manual development, copy `.env.example` to `.env`, start `npm run db:local` in one terminal, then run `npm run db:setup` and `npm run dev -- --hostname 127.0.0.1` in another. Restarting the local database discards its data and index; rerun setup. Never print or commit database credentials.

## Project structure and invariants

- `app/page.tsx`: Server Component for reads, pagination and empty/error states.
- `app/actions.ts`: form validation, mutation feedback and revalidation.
- `db/bookmarks.ts`: reads and writes of the `bookmarks` collection.
- `lib/mongodb.ts`: lazy shared MongoDB client and connection metadata.
- `lib/bookmark-types.ts`, `lib/bookmark-validation.ts`: shared values and runtime validation.
- `components/bookmark-form.tsx`, `components/bookmark-item.tsx`: client forms and cards.
- `scripts/setup-db.mjs`: explicit compound-index setup, separate from requests.
- `scripts/verify.mjs`, `playwright.config.ts`, `tests/e2e/`: isolated reader test harness.
- `.github/workflows/ci.yml`: checks on `bookmarks`, `main`, pull requests and manual dispatches.

The app deliberately has one shared bookmark list and no application sign-in or per-user ownership. Restrict hosted access at the deployment platform. Do not add authentication without a user request.

Preserve uncertainty when a mutation throws: the UI asks the user to refresh and check before retrying. A failed read must remain distinct from an empty collection.

## MongoDB model and skills

Read `EDD.md` before changing collections, fields, queries, validation or UI that depends on persisted data. Update it when the model changes. Keep `appName` set to `devrel-tutorial-javascript-nextjstemplate`.

Use the official MongoDB agent skills from https://github.com/mongodb/agent-skills whenever the task is MongoDB-specific and a matching skill exists.

## Evidence

Report the commands and results actually checked. Local tests do not prove Atlas, Codespaces or Vercel behavior. Do not rewrite dated evidence as though older runs used current versions.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
