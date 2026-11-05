# Bookmarks with Next.js and MongoDB

Save links with a title and an optional note, edit them in place, and browse older bookmarks 100 at a time.

## Setup

Use Node.js 24 or later from a currently supported LTS release, with its latest patches. You also need npm and a macOS or Linux shell. If you use nvm, `nvm install` and `nvm use` read the current LTS selection from `.nvmrc`.

```bash
npm ci
cp .env.example .env
```

Configure [MongoDB Atlas](https://www.mongodb.com/docs/atlas/getting-started/):

1. Create or select a cluster and add a database user with `readWrite` access to `bookmark_app`.
2. In Network Access, allow your computer’s public outbound IP address.
3. Choose **Connect → Drivers → Node.js** and copy the connection string. Replace the username and password placeholders, percent-encode reserved characters in the credentials, and put `bookmark_app` before the query string. Keep the other connection options Atlas supplies.
4. Set `MONGODB_URI` in `.env` to that connection string. Keep `.env` out of Git and never use a `NEXT_PUBLIC_` prefix for database credentials.

Create the index, then start the app:

```bash
npm run db:setup
npm run dev -- --hostname 127.0.0.1
```

The setup command prints `Bookmark index is ready.` Open http://127.0.0.1:3000 to add a bookmark. Reload to check it was saved, edit its note, then delete it.

`db:setup` creates the `bookmarks_newest_first` index on `{ createdAt: -1, _id: -1 }`. Run it once for each database; repeating it is safe. A `MONGODB_URI` already set in your terminal takes precedence over `.env`, so check that both commands use the intended database. Restart Next.js after changing `.env`.

## Tests

```bash
npx playwright install --with-deps chromium
npm run verify
npm run verify:dev
```

`verify` runs lint, TypeScript checks, a production build and three browser scenarios. `verify:dev` runs those scenarios against the development server. They cover saving, reloading, editing and deleting bookmarks, plus missing and unreachable database connections.

Both commands start and stop their own disposable MongoDB process and app servers. They do not use Atlas credentials or your running app. Use these commands instead of running Playwright directly. The CI workflow runs production checks on Node 24 and 26 for pushes to `bookmarks` or `main`, pull requests and manual runs.

## Deployment

This app has one shared bookmark list and no sign-in screen. Anyone who can access it can read and change the list, so restrict access through your hosting platform before adding database credentials.

For Vercel:

1. Enable **Vercel Authentication → All Deployments**, including the production domain. Review any bypass links or exceptions.
2. Add server-only `MONGODB_URI` for Production. Use a separate database and value for Preview deployments.
3. Configure [Atlas network access for Vercel](https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address) and run `npm run db:setup` for each database. The app’s public IP is not its database connection’s outbound IP.
4. Deploy again after changing environment variables. Check that signed-out visitors cannot open the production, preview or generated deployment URLs. Then sign in as an allowed visitor and repeat the bookmark CRUD flow.

The `>=24` engine range lets Vercel select its latest matching Node version, overriding the dashboard setting. Verify the runtime and app on each deployment. Vercel’s login gate controls web access; Atlas uses its own network rules and database credentials.

## License

Based on [MongoDB’s Next.js template](https://github.com/mongodb-developer/nextjs-template-mongodb). The original Apache License 2.0 is retained in [LICENSE](LICENSE).
