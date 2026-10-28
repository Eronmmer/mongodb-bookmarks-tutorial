# Tutorial outline: build a shared bookmarks app with Next.js and MongoDB

This outline guided the implementation and verification. The [working Google Doc draft](https://docs.google.com/document/d/1PsKBmGwGZt-PWeIgUWjp9XN6XXzOrwbvrAjt3HiLTZc) was created afterward. The [completed source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial) is now hosted privately; public reader access remains pending.

## 1. Show the finished app and define its scope

Introduce create, read, update and delete using a bookmark's title, URL and note. Show an empty list, a saved bookmark and an edit. Explain the accepted single-list model before setup: everyone admitted to the demo can change the same records. There are no application accounts or private bookmarks. Use public sample links.

## 2. Start from the official template

Credit [the upstream template at the reviewed commit](https://github.com/mongodb-developer/nextjs-template-mongodb/tree/09278fa9369ce03c3e988156351655f87317ecf6) and retain its licence. Explain that the starter provides a MongoDB connection check, not bookmarks CRUD. The completed adaptation is hosted in [the private companion repository](https://github.com/Eronmmer/mongodb-bookmarks-tutorial); do not direct readers to deploy the unmodified starter as the finished app.

Pin the environment to `.nvmrc` (Node 24.22.1) and `package-lock.json`; show `npm ci`. The refreshed lockfile includes Next.js 16.4.3, React 19.2.7, MongoDB driver 7.5.0 and Playwright 1.61.1. Keep dated audit results in the verification report.

## 3. Connect to Atlas, with a local alternative

Make Atlas the main teaching path: create/select a project and cluster, create a database user scoped to the demo database, configure the app host's outbound IP access, then obtain the Node.js driver URI and store it as `MONGODB_URI` in `.env`. Distinguish the Atlas login from the database user; explain URI credential encoding. Never expose the URI through `NEXT_PUBLIC_`, screenshots or committed files.

For local/Codespaces setup, explain changing outbound addresses and private forwarded ports. Do not promise a fixed Codespaces IP. Offer the exact local alternative from the README: `.env.example` selects `mongodb://127.0.0.1:27028/bookmarks_demo`; run `npm run db:local` and, in another terminal, `npm run dev -- --hostname 127.0.0.1`. Explain the real downloaded MongoDB 8.2.6 process and loss of data when the ephemeral helper stops.

Primary references: [Atlas connect](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/), [database users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/), [network access](https://www.mongodb.com/docs/atlas/security/ip-access-list/), [Codespaces security](https://docs.github.com/en/codespaces/reference/security-in-github-codespaces).

## 4. Define the document and validate input

Use `EDD.md`, `lib/bookmark-types.ts` and `lib/bookmark-validation.ts` to introduce `ObjectId`, title, URL, note and server timestamps. Explain trimmed lengths, HTTP(S)-only URLs without credentials, and exact 24-hex identifier checks. Validation is application code, not a database JSON schema. Generated fields and database selection never come from form input.

## 5. Connect lazily and implement database operations

Walk through `lib/mongodb.ts`: a server-only client, lazy connection, development cache, production module cache, bounded server-selection feedback and cache reset after rejection. Explain why imports/builds need not open a database connection.

Use `db/bookmarks.ts` to teach `insertOne`, `find`, `updateOne` and `deleteOne`, exact `_id` targeting, fixed `$set` fields and conversion of ObjectIds/dates to strings. Each page displays at most 100 records and fetches one extra to determine whether an older page exists. Explain the timestamp/ID cursor and the compound index installed by `npm run db:setup`.

## 6. Render and mutate from the app

Use `app/page.tsx` for a dynamic Node.js Server Component and separate empty and unavailable states. Use `app/actions.ts` for repeated server validation, writes, generic errors and `revalidatePath`. Use `components/bookmark-form.tsx` and `components/bookmark-item.tsx` for create/edit/delete controls, pending states and field feedback. Explain stale records and retained form values on failure.

## 7. Verify behavior with disposable data

Install Chromium with `npx playwright install --with-deps chromium`. Show `npm run verify` and `npm run verify:dev`, explain the production build without a URI, unit validation checks, isolated CRUD, and missing/unreachable database cases. Reference `scripts/verify.mjs`, `tests/unit/` and `tests/e2e/` against their final contents. Never use a shared Atlas collection as disposable test data.

Include only outcomes supported by the separate verification report. CI and Codespaces configuration are not hosted execution evidence.

## 8. Deploy with restricted access

Import the [completed source repository](https://github.com/Eronmmer/mongodb-bookmarks-tutorial) through an account with access to it. Configure Vercel Authentication → All Deployments before enabling working CRUD credentials, preferably through a team default before project creation. Verify every production, preview and generated URL and review protection exceptions/share-link bypasses. This access gate does not add per-user ownership inside the app.

Set `MONGODB_URI` for Production and any deployed Preview environment, then redeploy after changes. Explain dynamic Vercel outbound IPs and Static IPs on Pro/Enterprise. If the learning path deliberately uses Atlas `0.0.0.0/0`, explain that database connection attempts are permitted from everywhere; strong scoped credentials remain required. Do not imply Vercel Authentication protects the database port or supplies Atlas network access.

Require live checks before sharing: a clean unauthenticated browser must see the login gate, and replaying an actual valid Server Action POST without auth/bypass data must be gated and leave the database unchanged. A malformed POST is not proof. Confirm authorized CRUD separately. Mark these checks unperformed until recorded.

Primary references: [All Deployments on every plan, 9 September 2026](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan), [protection scope and all-request enforcement](https://vercel.com/docs/deployment-protection), [environment scopes](https://vercel.com/docs/environment-variables), [outbound networking](https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address), [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables).

## 9. Explain limits and next steps

Recap implemented CRUD and its evidence. Identify search, tags and persistent local database management as possible extensions. Application sign-in is outside the selected scope. Keep current access restrictions explicit. Add final source/demo links and screenshots only after their locations and behavior are verified; do not invent deployment results.
