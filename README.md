# Bookmarks with Next.js and MongoDB

A single-page bookmark app built from [MongoDB’s Next.js template](https://github.com/mongodb-developer/nextjs-template-mongodb). Save a link with a title and an optional note, edit it in place, confirm a deletion, and browse older entries 100 at a time.

This is the reader version used by the tutorial. It contains the app and the small browser test suite shown in the article. It uses one shared list with no application sign-in or per-user records. Use public sample links and restrict access through your deployment platform.

## Run the app locally

Use Node.js 24 or later, choosing a [currently supported LTS release](https://nodejs.org/en/about/previous-releases) and its latest patches. You also need Git, npm and a macOS or Linux shell. If you already have a suitable Node version installed, keep using it. For nvm users, `.nvmrc` follows the current LTS release. Skip the first two commands if you use another installer or version manager:

```bash
nvm install
nvm use
node --version
npm ci
cp .env.example .env
```

The example leaves `MONGODB_URI` empty. Configure Atlas before starting the app:

1. Create or select an Atlas project and cluster. Create a database user with `readWrite` access to `bookmark_app`, separate from your Atlas website account.
2. Allow the public outbound IP of the machine running Node in Atlas Network Access. Recheck this address if your network changes or you restart a Codespace.
3. Choose Connect → Drivers → Node.js. Copy the connection string, replace credential placeholders, percent-encode reserved characters in credentials, and include `bookmark_app` before the query string. Retain the options Atlas supplies.
4. Set `MONGODB_URI` in `.env` to that connection string. Keep the URI out of Git, screenshots and logs, and never use a `NEXT_PUBLIC_` prefix.

Prepare the index, then start the app:

```bash
npm run db:setup
npm run dev -- --hostname 127.0.0.1
```

Wait for `Bookmark index is ready.`, then open http://127.0.0.1:3000. Add a sample bookmark, refresh to read it again, edit its note, then delete it. Atlas keeps saved bookmarks after the app stops. Restart Next.js after changing `.env`.

`db:setup` creates `bookmarks_newest_first` on `{ createdAt: -1, _id: -1 }`; the app does not create indexes during requests. Run setup for each target database before starting the app. Repeating it is safe. `npm ci` installs the versions recorded in `package-lock.json`.

## Optional temporary local database

For disposable manual development, set `.env` to:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27028/bookmark_app
```

If `MONGODB_URI` is also set in your terminal environment, update or unset it so it does not override `.env`. Start the database in one terminal and leave it running:

```bash
npm run db:local
```

The helper downloads and starts a real MongoDB 9.0.4 process on `127.0.0.1:27028`. Its data is temporary and is deleted when the helper stops. If the port is occupied, the helper reports an error.

In a second terminal at the project root, select the same Node version, then run `npm run db:setup` and `npm run dev -- --hostname 127.0.0.1`. Run setup again each time you restart the temporary database, because its index is deleted along with its data. Stop the app and database with Ctrl+C.

## Run in Codespaces

The devcontainer uses Debian Bookworm with Node 24 and runs `npm ci`. It does not configure Atlas, supply credentials or start the database/app. Follow the Atlas setup above in its terminal, or use the optional temporary database. Open port 3000 through the Ports panel and keep its visibility Private. For Atlas, allow the Codespace’s outbound IP and recheck it after a restart.

## Check the app

```bash
npx playwright install --with-deps chromium
npm run verify
npm run verify:dev
```

`verify` runs lint, TypeScript and a production build, then browser checks. `verify:dev` runs the browser checks against the development server. Both start their own temporary MongoDB 9.0.4 instance and Next.js processes, create the index in a unique test database, and stop their processes when finished. They exercise the CRUD flow and missing/unreachable database states. They do not use Atlas credentials or an existing development server. This reader version does not include the separate unit test suite.

Use these commands rather than invoking Playwright directly. The runner uses POSIX process groups and is intended for macOS or Linux; installing Chromium dependencies on Linux may require elevated permissions. The GitHub workflow runs `npm run verify` on Node 24 and 26 for pushes to `bookmarks` or `main`, pull requests and manual dispatches.

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

The package declares Node 24 as its minimum (`>=24`). Vercel selects its latest available version that satisfies this range, overriding its dashboard setting. CI checks Node 24 and 26. Verify each new deployment before relying on earlier hosted results. See [Vercel’s Node.js version selection](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Attribution

Based on the MongoDB Next.js template. The original MIT licence is retained in `LICENSE`.
