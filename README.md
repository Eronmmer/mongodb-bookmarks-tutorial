# Bookmarks with Next.js and MongoDB

A single-page bookmark app built from [MongoDB’s Next.js template](https://github.com/mongodb-developer/nextjs-template-mongodb). Save a link with a title and an optional note, edit it in place, confirm a deletion, and browse older entries 100 at a time.

This is the reader version used by the tutorial. It contains the app and the small browser test suite shown in the article. It uses one shared list with no application sign-in or per-user records. Use public sample links and restrict access through your deployment platform.

## Run the app locally

Use Node.js 24 LTS, Git, npm and a macOS or Linux shell. `.nvmrc` selects the latest installed or available patch in Node 24 when used with nvm.

```bash
nvm install
nvm use
npm ci
cp .env.example .env
npm run db:local
```

Leave the database terminal running. The helper downloads and starts MongoDB 9.0.4 on `127.0.0.1:27028`. Its data is temporary and is deleted when the helper stops. If the port is occupied, the helper reports an error.

In a second terminal at the project root:

```bash
nvm use
npm run db:setup
npm run dev -- --hostname 127.0.0.1
```

Wait for `Bookmark index is ready.`, then open http://127.0.0.1:3000. Run `db:setup` again each time you restart the temporary database.

If you use a different Node version manager, select Node 24 and omit the nvm commands. `npm ci` installs the versions recorded in `package-lock.json`.

## Use MongoDB Atlas

Set `MONGODB_URI` in `.env` to the Atlas driver connection string. Include the database name `bookmark_app` before the query string, retain the options Atlas provides, and percent-encode reserved characters in credentials. Create a database user with `readWrite` access to that database and allow the Node host’s outbound IP in Atlas Network Access.

Run `npm run db:setup` against the selected database before starting the app. It creates `bookmarks_newest_first` on `{ createdAt: -1, _id: -1 }`; the app does not create indexes during requests. Restart Next.js after changing `.env`. Keep credentials out of Git and never use a `NEXT_PUBLIC_` prefix for this URI.

## Run in Codespaces

The devcontainer uses Debian Bookworm with Node 24 and runs `npm ci`. Run the same database setup and app commands in its terminal. Open port 3000 through the Ports panel and keep its visibility Private. If using Atlas, allow the Codespace’s outbound IP and recheck it after a restart.

## Check the app

```bash
npx playwright install --with-deps chromium
npm run verify
npm run verify:dev
```

`verify` runs lint, TypeScript and a production build, then browser checks. `verify:dev` runs the browser checks against the development server. Both start their own temporary MongoDB 9.0.4 instance and Next.js processes, create the index in a unique test database, and stop their processes when finished. They exercise the CRUD flow and missing/unreachable database states. They do not use Atlas credentials or an existing development server. This reader version does not include the separate unit test suite.

Use these commands rather than invoking Playwright directly. The runner uses POSIX process groups and is intended for macOS or Linux; installing Chromium dependencies on Linux may require elevated permissions. The GitHub workflow runs `npm run verify` on pushes to `bookmarks` or `main`, pull requests and manual dispatches.

## Project structure

- `app/page.tsx`: Server Component that reads bookmarks and renders pagination or an appropriate empty/error state.
- `app/actions.ts`: validates form input, calls the database operations and returns form feedback.
- `db/bookmarks.ts`: MongoDB queries and conversion to the UI’s string IDs and dates.
- `lib/mongodb.ts`: lazy, reusable MongoDB client.
- `lib/bookmark-types.ts` and `lib/bookmark-validation.ts`: shared shapes and runtime input checks.
- `components/bookmark-form.tsx` and `components/bookmark-item.tsx`: add, edit and delete interfaces.
- `scripts/`: local database, index setup and isolated verification helpers.
- `tests/e2e/bookmarks.spec.ts`: the article’s browser tests.
- `EDD.md`: the document model and query contract.

## Deployment

Deploy the completed application, not the unmodified template. Configure Vercel Authentication with All Deployments before adding a working Atlas URI. Standard Protection leaves production domains public. Check exceptions and bypass links, configure Atlas networking, and run `db:setup` for each target database before deploying.

Use separate Production and Preview databases where possible. Redeploy after changing environment variables. Verify that production, preview and generated deployment URLs require authentication in a signed-out browser, then repeat the CRUD flow as an allowed visitor before sharing the app. Vercel’s gate controls web access; it does not restrict direct connections to MongoDB.

## Attribution

Based on the MongoDB Next.js template. The original MIT licence is retained in `LICENSE`.
