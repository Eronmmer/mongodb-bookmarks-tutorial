# Build a Bookmark App With Next.js and MongoDB

A useful article or documentation page can get lost in a growing list of saved links. We’ll build a small bookmark app with Next.js and MongoDB that keeps a title and an optional note alongside each URL, giving you some context when you return to it. You’ll be able to save a link, find it again after reloading the page, and edit or delete it as your list changes.

We’ll start with [MongoDB’s Next.js template](https://github.com/mongodb-developer/nextjs-template-mongodb), then add the database operations, forms and browser tests. Every file and command needed for the build is included below. The [finished application on GitHub](https://github.com/Eronmmer/mongodb-bookmarks-tutorial) is an optional reference if you’d like to compare your implementation as you go.

## What we’re building

Everything happens on one page. A form lets you save a bookmark, and each saved link has Edit and Delete buttons. You can edit an item in place, while deletion asks you to confirm before removing it. As the list grows, you can browse 100 bookmarks at a time, move to older entries, and return to the newest page.

Here’s the finished application:

![The finished bookmarks app](images/bookmarks-desktop.png)

We’re keeping the app to one shared bookmark list, with no application sign-in or per-user records. Anyone who can open it can read and change that list. For this tutorial, we’ll use public sample links and restrict access through the deployment platform.

## How Next.js and MongoDB fit together

Next.js lets us build the React interface and run server code in the same project. MongoDB stores each bookmark as a document, and the official MongoDB Node.js driver gives us the operations to read, create, update and delete those documents.

The page will be a [Server Component](https://nextjs.org/docs/app/getting-started/server-and-client-components), so it can read MongoDB before rendering the list. The forms need interactive state for editing and pending submissions, so they’ll be Client Components. When you submit a form, it calls one of our [Server Actions](https://nextjs.org/docs/app/guides/forms) to validate the fields, write to MongoDB and refresh the page. This keeps the database connection string on the server.

## Before you start

You’ll need some familiarity with React components, props and forms. The commands use Git, npm and a macOS or Linux shell. Install [Node.js](https://nodejs.org/en/download) 24.22.1. If you manage Node versions with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating), we’ll create a .nvmrc file to select it for this project.

You can [create an Atlas account](https://www.mongodb.com/cloud/atlas/register) and cluster for the database, or use the temporary local MongoDB helper we’ll write below. Choose Atlas if you want to keep your data between sessions. The local helper is useful for trying the app, but discards its data when you stop it.

## Set up the Next.js template

Clone the template into a new directory, then create a branch. The long commit ID selects the exact template version used to test this tutorial, so future template updates won’t change your starting files:

```bash
git clone https://github.com/mongodb-developer/nextjs-template-mongodb.git bookmarks-build
cd bookmarks-build
git switch -c bookmarks 09278fa9369ce03c3e988156351655f87317ecf6
```

The template takes care of most of the setup for us. It already includes Next.js, React, TypeScript, Tailwind CSS, the MongoDB driver and Playwright. We’ll install its locked dependencies first, then make a few changes for our bookmark app.

Create .nvmrc and select Node 24.22.1, then install the template’s locked dependencies. If you installed Node without nvm, skip all nvm commands in this tutorial and check that node --version prints v24.22.1.

```bash
printf '24.22.1\n' > .nvmrc
nvm install
nvm use
node --version
npm ci
```

Before we start building, we’ll update the dependencies to the versions tested for this tutorial. The template snapshot includes older packages, so this step brings in a [patched Next.js release](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) and keeps its ESLint configuration in sync.

Most packages in the commands below are already in the template. We’re adding two helpers: `server-only`, which we’ll import in our database modules to catch accidental use in client code, and `mongodb-memory-server-core`, which starts a temporary MongoDB database for local development and tests.

```bash
npm install --save-exact next@16.4.3 react@19.2.7 react-dom@19.2.7 \
  mongodb@7.5.0 server-only@0.0.1
npm install --save-dev --save-exact @playwright/test@1.61.1 \
  mongodb-memory-server-core@11.3.0 eslint-config-next@16.4.3
npm update
npm pkg set 'engines.node=24.x'
```

The version numbers identify the releases we tested together. `--save-exact` records those versions in `package.json`, while [`npm update`](https://docs.npmjs.com/cli/v11/commands/npm-update/) refreshes the other dependencies within their allowed version ranges. Keep both `package.json` and `package-lock.json` in Git. Once setup is complete, use `npm ci` to reinstall the versions recorded in your lockfile.

The template already has dev, build and start commands. Add two commands for the database helpers we’ll create next, and make their directory:

```bash
mkdir -p scripts
npm pkg set \
  'scripts.db:local=node scripts/local-db.mjs' \
  'scripts.db:setup=node --env-file-if-exists=.env scripts/setup-db.mjs'
```

Replace .env.example with this local connection setting. It contains no password; Atlas users will replace the value in their own .env file in the next section.

`.env.example`

```bash
MONGODB_URI=mongodb://127.0.0.1:27028/bookmark_app
```

In .gitignore, replace the existing .env entry with the following two lines. They keep local environment files out of commits while allowing the credential-free example file to be tracked:

```bash
.env*
!.env.example
```

Copy the example to .env. Keep using the same Node version whenever you open another terminal for this project.

```bash
cp .env.example .env
```

## Connect to MongoDB

### Use MongoDB Atlas

Create or select an Atlas project and cluster, then add a [database user](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/) with readWrite access to bookmark_app. This is the user the app will connect as, separate from the account you use to sign in to Atlas.

Atlas also needs to allow connections from the machine running Node.js. In [Network Access](https://www.mongodb.com/docs/atlas/security/ip-access-list/), add that machine’s public outbound IP address. For local development, this is usually your computer’s current public IP. For Codespaces or another host, use that host’s outbound address.

Choose [Connect → Drivers → Node.js](https://www.mongodb.com/docs/atlas/driver-connection/) and copy the mongodb+srv:// connection string into MONGODB_URI in .env. Fill in your database username and password, then add bookmark_app between the final slash and the query string. Keep the options Atlas supplies.

The database portion of the URI should read /bookmark_app? followed by the existing query options. [Percent-encode reserved characters](https://www.mongodb.com/docs/manual/reference/connection-string-formats/) in the credentials, and keep .env out of source control. Leave the variable named MONGODB_URI: adding a [NEXT_PUBLIC_](https://nextjs.org/docs/app/guides/environment-variables) prefix would expose referenced values to browser code.

### Or start a temporary local database

If you choose the local database, keep MONGODB_URI set to the value from .env.example:

```bash
MONGODB_URI=mongodb://127.0.0.1:27028/bookmark_app
```

Create scripts/local-db.mjs with the helper below. It starts a real MongoDB process on loopback and stops it when you press Ctrl+C. A fixed port keeps the connection string predictable; if that port is already in use, startup fails with a message.

`scripts/local-db.mjs`

```javascript
import { MongoMemoryServer } from "mongodb-memory-server-core";

let mongo;
try {
  mongo = await MongoMemoryServer.create({
    binary: { version: "8.2.6" },
    // .env.example uses this exact port. Never silently start elsewhere.
    instance: { ip: "127.0.0.1", port: 27028, portGeneration: false, dbName: "bookmark_app" },
  });
} catch {
  console.error("Could not start local MongoDB on 127.0.0.1:27028. Check that the port is free and the MongoDB binary can be downloaded.");
  process.exit(1);
}
console.log("Temporary local MongoDB; all data is lost when this process stops.");
console.log(`MONGODB_URI=${mongo.getUri("bookmark_app")}`);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await mongo.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
await new Promise(() => {});
```

Start the helper from the project root and leave this terminal running:

```bash
nvm use
npm run db:local
```

The helper starts a real MongoDB 8.2.6 process on port 27028, downloading the database binary on its first run. Its data lasts only for that session: stopping the helper deletes it. If port 27028 is occupied, the helper reports an error rather than silently choosing another port.

### Prepare the bookmark index

Create scripts/setup-db.mjs to prepare the index. The script reads MONGODB_URI from the environment, creates the index, and closes its connection. The db:setup command we added also loads .env for you.

`scripts/setup-db.mjs`

```javascript
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Set MONGODB_URI before preparing the database.");
  process.exit(1);
}

let client;
try {
  client = new MongoClient(uri, {
    appName: "devrel-tutorial-javascript-nextjstemplate",
    serverSelectionTimeoutMS: 5000,
  });
  await client.connect();
  await client.db().collection("bookmarks").createIndex(
    { createdAt: -1, _id: -1 },
    { name: "bookmarks_newest_first" },
  );
  console.log("Bookmark index is ready.");
} catch {
  console.error("Could not prepare the bookmark index. Check the connection and database permissions.");
  process.exitCode = 1;
} finally {
  await client?.close().catch(() => {
    console.error("Could not close the database connection.");
    process.exitCode = 1;
  });
}
```

With your chosen database running, open another terminal at the project root and run the setup command below. It reads MONGODB_URI from .env unless you’ve already set that variable in the terminal environment:

```bash
nvm use
npm run db:setup
```

Wait for “Bookmark index is ready.” The command creates bookmarks_newest_first, a compound index on { createdAt: -1, _id: -1 } that supports the ordering and pagination we’ll add later. Run it for each database before starting the app, and again whenever you restart the disposable local helper. You can repeat the setup without creating a second copy of the index. The database user must have permission to create indexes.

### Check the connection

Before checking the connection, open lib/mongodb.ts and change the existing appName option to this value:

```typescript
appName: "devrel-tutorial-javascript-nextjstemplate",
```

MongoDB includes this value in its connection metadata to identify the app. We’ll keep it when we replace the connection helper later.

Before starting the template, replace app/layout.tsx with this layout. It sets the page title and uses the system font instead of downloading a web font:

`app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookmarks",
  description:
    "Save your useful links in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

In tailwind.config.ts, find theme.extend.fontFamily and replace its sans array with the line below. Keep the existing defaultTheme import and the rest of the configuration.

```typescript
sans: [...defaultTheme.fontFamily.sans],
```

In the terminal where you ran the index setup, start the template:

```bash
nvm use
npm run dev -- --hostname 127.0.0.1
```

Open http://127.0.0.1:3000 and look for “Database connected” on the starter page. If it isn’t there, check the URI and database user. For Atlas, also check the IP access list; for the local database, make sure the helper is still running. Restart Next.js whenever you change .env.

Once the connection works, stop Next.js with Ctrl+C, leaving the local database running if you’re using it. The next sections replace the starter’s database helper and page and add the forms. Keep Next.js stopped until those pieces are in place, then we’ll restart it and try the finished flow.

## Define the bookmark data

Before writing queries, let’s decide what a bookmark contains: a title, a URL, an optional note, and the times it was created and last edited. MongoDB stores those timestamps as dates, and the Node.js driver generates an ObjectId for each document’s _id. We’ll convert the identifier and dates to strings for the UI.

Create lib/bookmark-types.ts with the definitions below. BookmarkInput describes the values submitted by the form, BookmarkView describes the bookmark displayed on the page, and ActionState carries the server’s feedback back to the form.

`lib/bookmark-types.ts` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/lib/bookmark-types.ts))

```typescript
// Pure shared types for the bookmarks app. Safe to import from both server
// and client code — this file must not import server-only modules.

export interface BookmarkInput {
  title: string;
  url: string;
  note: string;
}

// Client-facing view model: `id` is the hex string form of `_id` and dates
// are ISO strings, so this shape can cross the server/client boundary.
export interface BookmarkView {
  id: string;
  title: string;
  url: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type BookmarkFieldErrors = {
  title?: string;
  url?: string;
  note?: string;
};

export interface BookmarkValues {
  id: string;
  title: string;
  url: string;
  note: string;
}

// Shape returned by the server actions used with `useActionState`.
export interface ActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: BookmarkFieldErrors;
  values: BookmarkValues;
}

export const emptyActionState: ActionState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  values: { id: "", title: "", url: "", note: "" },
};
```

We’ll store an empty note as an empty string. Keeping the field present lets new bookmarks, saved bookmarks and failed form submissions use the same shape.

### Validate the submitted fields

TypeScript helps us work with these shapes in our code, but incoming form data still needs to be checked at runtime. We’ll validate it before any write reaches MongoDB. Create lib/bookmark-validation.ts with the following code:

`lib/bookmark-validation.ts` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/lib/bookmark-validation.ts))

```typescript
// Application-level validation for bookmark documents. There is no JSON
// schema validation on the MongoDB collection itself — this module is the
// single source of truth for what a bookmark may contain.

export type BookmarkValidationErrors = {
  title?: string;
  url?: string;
  note?: string;
};

export type BookmarkValidationResult =
  | { success: true; data: { title: string; url: string; note: string } }
  | { success: false; errors: BookmarkValidationErrors };

const MAX_TITLE_LENGTH = 120;
const MAX_URL_LENGTH = 2048;
const MAX_NOTE_LENGTH = 1000;

const BOOKMARK_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

/**
 * Validates raw, untrusted form input. Values that are not strings (missing
 * fields, files, numbers, …) are rejected, never coerced.
 */
export function validateBookmark(input: {
  title: unknown;
  url: unknown;
  note: unknown;
}): BookmarkValidationResult {
  const errors: BookmarkValidationErrors = {};

  const title = readTrimmedString(input.title);
  if (title === null || title.length === 0) {
    errors.title = "Title is required.";
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`;
  }

  const url = readTrimmedString(input.url);
  if (url === null || url.length === 0) {
    errors.url = "URL is required.";
  } else if (url.length > MAX_URL_LENGTH) {
    errors.url = `URL must be ${MAX_URL_LENGTH} characters or fewer.`;
  } else {
    const urlError = validateUrl(url);
    if (urlError) {
      errors.url = urlError;
    }
  }

  const note = readTrimmedString(input.note);
  if (note === null) {
    errors.note = "Note must be text.";
  } else if (note.length > MAX_NOTE_LENGTH) {
    errors.note = `Note must be ${MAX_NOTE_LENGTH} characters or fewer.`;
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      // A note may be empty; the empty string is persisted.
      title: title as string,
      url: url as string,
      note: note as string,
    },
  };
}

/**
 * Returns true only for an exact 24-character hex string, i.e. the string
 * form of a MongoDB ObjectId. Always validate before calling `new ObjectId()`.
 */
export function isBookmarkId(value: unknown): value is string {
  return typeof value === "string" && BOOKMARK_ID_PATTERN.test(value);
}

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  return value.trim();
}

function validateUrl(url: string): string | null {
  if (!/^https?:\/\//i.test(url)) {
    return "Enter an absolute http or https URL, for example https://example.com.";
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "Enter a valid URL, for example https://example.com.";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Only http and https URLs are supported.";
  }
  if (parsed.hostname.length === 0) {
    return "The URL must include a hostname.";
  }
  if (parsed.username !== "" || parsed.password !== "") {
    return "URLs with a username or password are not allowed.";
  }
  return null;
}
```

The validator trims the text, rejects missing or non-string values, and checks the field lengths. For a URL, it requires an explicit http:// or https:// prefix, checks the parsed result, and rejects embedded usernames or passwords. These checks tell us whether the link has an acceptable format; they don’t visit its destination.

Updates and deletes also need a valid identifier. The ID check requires exactly 24 hexadecimal characters before we construct an ObjectId. All of this validation happens in the application; this example does not add a JSON schema validator to the MongoDB collection.

## Reuse the database connection

The template exports a client promise from its connection helper. We’ll replace that with getClient(), which connects when first called, and getDatabase(), which selects the database named in the URI. Replace lib/mongodb.ts with the following code:

`lib/mongodb.ts` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/lib/mongodb.ts))

```typescript
import "server-only";

import { MongoClient, type Db, type MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;

// Connection metadata so MongoDB can identify this app in monitoring and
// logs. Keep this in sync with EDD.md.
const appName = "devrel-tutorial-javascript-nextjstemplate";

// Wait up to five seconds to select a MongoDB server.
// This timeout does not limit the full HTTP request.
const serverSelectionTimeoutMS = 5000;

const options: MongoClientOptions = {
  appName,
  serverSelectionTimeoutMS,
};

let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Lazily connects to MongoDB and returns a shared client promise. The client
 * is created only on first use (nothing connects at import time, so a static
 * build never opens a connection) and the promise is cached:
 * - development: on `globalThis`, so the client survives HMR reloads
 * - production: on this module
 * A failed connection attempt clears the cached promise so a later call can
 * retry. Connection details and raw driver errors are never logged here.
 */
export function getClient(): Promise<MongoClient> {
  if (!uri) {
    // Generic message only — never echo connection strings or secrets.
    throw new Error(
      "MongoDB is not configured. Set the MONGODB_URI environment variable.",
    );
  }

  if (process.env.NODE_ENV === "development") {
    if (global._mongoClientPromise) {
      return global._mongoClientPromise;
    }
    clientPromise = new MongoClient(uri, options)
      .connect()
      .catch((error) => {
        global._mongoClientPromise = undefined;
        clientPromise = null;
        throw error;
      });
    global._mongoClientPromise = clientPromise;
    return clientPromise;
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(uri, options)
      .connect()
      .catch((error) => {
        clientPromise = null;
        throw error;
      });
  }
  return clientPromise;
}

/**
 * Returns the default database from MONGODB_URI. The database is never
 * selected from untrusted input.
 */
export async function getDatabase(): Promise<Db> {
  const client = await getClient();
  return client.db();
}
```

Opening a new client for every bookmark operation would mean setting up connections repeatedly. Instead, this helper reuses one client promise within a running server instance. During development, it stores the promise on globalThis so hot reloads can reuse it; in production, it stores it in the module. If the initial connection fails, the helper clears that promise so a later request can try again.

The serverSelectionTimeoutMS option limits how long the driver waits to select a server when MongoDB is unavailable. We’ve set it to five seconds. This timeout doesn’t limit the whole HTTP request. The server-only import also prevents a Client Component from importing this module.

## Add the MongoDB operations

With a connection helper in place, we can write the queries the page and form actions will share. Create db/bookmarks.ts with these imports, the document interface and the collection helpers. BOOKMARK_LIST_LIMIT sets the number of bookmarks shown on each page:

`db/bookmarks.ts` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/db/bookmarks.ts))

```typescript
import "server-only";

import { ObjectId, type WithId } from "mongodb";

import { isBookmarkId } from "@/lib/bookmark-validation";
import type { BookmarkInput, BookmarkView } from "@/lib/bookmark-types";
import { getDatabase } from "@/lib/mongodb";

const COLLECTION_NAME = "bookmarks";

// Each page shows at most 100 bookmarks, with a cursor for older records.
export const BOOKMARK_LIST_LIMIT = 100;

interface BookmarkDocument {
  title: string;
  url: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

async function getCollection() {
  const database = await getDatabase();
  return database.collection<BookmarkDocument>(COLLECTION_NAME);
}

function toBookmarkView(document: WithId<BookmarkDocument>): BookmarkView {
  return {
    id: document._id.toString(),
    title: document.title,
    url: document.url,
    note: document.note,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}
```

BookmarkDocument describes the fields we store in MongoDB. WithId adds the _id that is present after insertion, and toBookmarkView converts it and the timestamps to the strings our components expect.

### Read the saved bookmarks

We’ll read the list a page at a time, using the last displayed bookmark to find where the next page begins. Append the cursor reader and list function to db/bookmarks.ts:

`db/bookmarks.ts` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/db/bookmarks.ts))

```typescript
/** Reject malformed cursors before constructing a database filter. */
function readCursor(value: string | string[] | undefined) {
  if (typeof value !== "string" || value.length > 64) return null;
  const parts = value.split("_");
  if (parts.length !== 2 || !isBookmarkId(parts[1])) return null;
  const createdAt = new Date(parts[0]);
  if (!Number.isFinite(createdAt.getTime()) || createdAt.toISOString() !== parts[0]) {
    return null;
  }
  return { createdAt, _id: new ObjectId(parts[1]) };
}

/** Read one page plus one record to determine whether an older page exists. */
export async function listBookmarks(before?: string | string[]) {
  const cursor = readCursor(before);
  const collection = await getCollection();
  const filter = cursor
    ? { $or: [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
      ] }
    : {};
  const documents = await collection
    .find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(BOOKMARK_LIST_LIMIT + 1)
    .toArray();
  const hasMore = documents.length > BOOKMARK_LIST_LIMIT;
  const bookmarks = documents.slice(0, BOOKMARK_LIST_LIMIT).map(toBookmarkView);
  const last = bookmarks.at(-1);
  return {
    bookmarks,
    nextCursor: hasMore && last ? `${last.createdAt}_${last.id}` : null,
    isOlderPage: cursor !== null,
  };
}
```

This approach is called keyset pagination. The cursor carries the timestamp and ID of the last displayed bookmark, and readCursor() validates the ISO date and 24-character hexadecimal ID before building the filter. A malformed cursor returns the newest page. Sorting by createdAt and _id gives bookmarks a stable order even when their timestamps match. The query reads 101 records, shows the first 100, and uses the extra record to decide whether there’s another page. That answers the pagination question without counting the whole collection. The compound index from db:setup matches the sort order.

### Create a bookmark

To save a bookmark, we’ll insert the validated form fields along with timestamps supplied by the server. Append createBookmark() to the same file:

`db/bookmarks.ts` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/db/bookmarks.ts))

```typescript
/**
 * Inserts a bookmark. Only the validated fields (title, url, note) plus
 * server-generated timestamps are written; callers pass typed, already
 * validated input (app/actions.ts validates before calling).
 */
export async function createBookmark(input: BookmarkInput): Promise<BookmarkView> {
  const now = new Date();
  const collection = await getCollection();
  const { insertedId } = await collection.insertOne({
    title: input.title,
    url: input.url,
    note: input.note,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: insertedId.toString(),
    title: input.title,
    url: input.url,
    note: input.note,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}
```

insertOne() writes the document and returns its generated identifier. Listing each field explicitly keeps extra request properties out of the document. Both timestamps use the same server-generated value for a new bookmark.

### Update a bookmark

An edit should change the bookmark’s contents while preserving when it was created. Append updateBookmark() next:

`db/bookmarks.ts` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/db/bookmarks.ts))

```typescript
/** Updates title, url, note and updatedAt only; createdAt is preserved. */
export async function updateBookmark(
  id: string,
  input: BookmarkInput,
): Promise<boolean> {
  if (!isBookmarkId(id)) {
    return false;
  }
  const collection = await getCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        title: input.title,
        url: input.url,
        note: input.note,
        updatedAt: new Date(),
      },
    },
  );
  return result.matchedCount > 0;
}
```

The query selects one document by _id, then $set changes the editable fields and updatedAt while leaving createdAt intact. Returning whether a document matched lets the form handle a case that’s easy to miss: another visitor may have deleted the bookmark while the editor was open.

### Delete a bookmark

Finish db/bookmarks.ts with deleteBookmark(), which removes one bookmark by its identifier:

`db/bookmarks.ts` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/db/bookmarks.ts))

```typescript
export async function deleteBookmark(id: string): Promise<boolean> {
  if (!isBookmarkId(id)) {
    return false;
  }
  const collection = await getCollection();
  const result = await collection.deleteOne({
    _id: new ObjectId(id),
  });
  return result.deletedCount > 0;
}
```

deleteOne() reports how many documents it removed. A deletedCount of zero tells us there was nothing left to delete, which can happen when someone else has already removed the bookmark from the shared list.

## Handle form submissions with Server Actions

The database functions are ready to use, but they expect validated values. Server Actions will connect them to the browser forms: each action reads FormData, validates the input, calls the appropriate database function, and returns feedback the form can display.

Create app/actions.ts and start with the imports, messages and helpers below:

`app/actions.ts` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/app/actions.ts))

```typescript
"use server";

import { revalidatePath } from "next/cache";

import {
  createBookmark,
  deleteBookmark,
  updateBookmark,
} from "@/db/bookmarks";
import { isBookmarkId, validateBookmark } from "@/lib/bookmark-validation";
import type {
  ActionState,
  BookmarkFieldErrors,
  BookmarkValues,
} from "@/lib/bookmark-types";
import { emptyActionState } from "@/lib/bookmark-types";

const UNCONFIRMED_WRITE_SUFFIX =
  "Refresh the page to check the result before trying again.";
const RECORD_GONE_SUFFIX =
  "Refresh the page to see the current list.";

function readFormValue(formData: FormData, field: string): string {
  const value = formData.get(field);
  // Anything that is not a string (e.g. a file upload) is treated as missing
  // and rejected by validateBookmark.
  return typeof value === "string" ? value : "";
}

function readValues(formData: FormData): BookmarkValues {
  return {
    id: readFormValue(formData, "id"),
    title: readFormValue(formData, "title"),
    url: readFormValue(formData, "url"),
    note: readFormValue(formData, "note"),
  };
}

function errorState(
  message: string,
  fieldErrors: BookmarkFieldErrors,
  values: BookmarkValues,
): ActionState {
  return { status: "error", message, fieldErrors, values };
}
```

The "use server" directive marks the exported actions as server code. readValues() keeps a copy of the submitted text so the form can show it again. The validation calls below still receive the raw FormData values, ensuring that non-string inputs go through the checks.

### Save a new bookmark

Start with the action for adding a bookmark. Append this to app/actions.ts:

`app/actions.ts` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/app/actions.ts))

```typescript
export async function createBookmarkAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = readValues(formData);
  const parsed = validateBookmark({
    title: formData.get("title"),
    url: formData.get("url"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      parsed.errors,
      values,
    );
  }

  try {
    await createBookmark(parsed.data);
  } catch {
    return errorState(
      `Could not confirm that the bookmark was saved. ${UNCONFIRMED_WRITE_SUFFIX}`,
      {},
      values,
    );
  }

  revalidatePath("/");
  return {
    status: "success",
    message: "Bookmark saved.",
    fieldErrors: {},
    values: { id: "", title: "", url: "", note: "" },
  };
}
```

If validation fails, the action returns the field errors along with the values the user entered. A write error needs different handling: it doesn’t always tell us whether MongoDB saved the record, so we ask the user to refresh and check before retrying. After a confirmed insert, [revalidatePath("/")](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) refreshes the list, and the empty values prepare the form for the next bookmark.

### Save an edit

The edit action also needs to know which bookmark to change. Append the update action:

`app/actions.ts` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/app/actions.ts))

```typescript
export async function updateBookmarkAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = readValues(formData);

  if (!isBookmarkId(values.id)) {
    return errorState(
      `This bookmark could not be updated — it may have been deleted. ${RECORD_GONE_SUFFIX}`,
      {},
      values,
    );
  }

  const parsed = validateBookmark({
    title: formData.get("title"),
    url: formData.get("url"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return errorState("Please fix the highlighted fields.", parsed.errors, values);
  }

  try {
    const updated = await updateBookmark(values.id, parsed.data);
    if (!updated) {
      return errorState(
        `This bookmark no longer exists — it may have been deleted. ${RECORD_GONE_SUFFIX}`,
        {},
        values,
      );
    }
  } catch {
    return errorState(
      `Could not confirm your changes. ${UNCONFIRMED_WRITE_SUFFIX}`,
      {},
      values,
    );
  }

  revalidatePath("/");
  return { status: "success", message: "Bookmark updated.", fieldErrors: {}, values };
}
```

An edit requires a valid bookmark ID as well as valid field values. If the record disappeared after the page loaded, the action asks the user to refresh. Validation errors and unconfirmed writes keep the entered values available; an unconfirmed write also asks the user to check the current record before trying again.

### Confirm a deletion

Append the delete action to complete app/actions.ts:

`app/actions.ts` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/app/actions.ts))

```typescript
export async function deleteBookmarkAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = readFormValue(formData, "id");

  if (!isBookmarkId(id)) {
    return {
      ...emptyActionState,
      status: "error",
      message: `This bookmark no longer exists — it may have already been deleted. ${RECORD_GONE_SUFFIX}`,
    };
  }

  try {
    const deleted = await deleteBookmark(id);
    if (!deleted) {
      return {
        ...emptyActionState,
        status: "error",
        message: `This bookmark no longer exists — it may have already been deleted. ${RECORD_GONE_SUFFIX}`,
      };
    }
  } catch {
    return {
      ...emptyActionState,
      status: "error",
      message: `Could not confirm the deletion. ${UNCONFIRMED_WRITE_SUFFIX}`,
    };
  }

  revalidatePath("/");
  return { ...emptyActionState, status: "success", message: "Bookmark deleted." };
}
```

We’ll ask for confirmation in the UI, but the action still checks the ID because a request can be sent without using that button. A confirmed delete refreshes the page. If the database call throws, the message asks the user to refresh and check whether the bookmark remains before retrying.

## Build the bookmark interface

We’ll give the page a warm background, dark text and a green accent. Replace app/globals.css with the styles below. The color variables also keep the template’s existing Tailwind theme usable.

`app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply relative min-w-[320px] min-h-screen antialiased;
  /* Warm white background, dark ink text, native system fonts. */
  @apply bg-[#FAF7F0] text-[#1C2B26];
  -webkit-tap-highlight-color: transparent;
}



@layer base {
  :root {
    --background: 40 43% 96%;
    --foreground: 163 20% 14%;
    --card: 0 0% 100%;
    --card-foreground: 163 20% 14%;
    --popover: 0 0% 100%;
    --popover-foreground: 163 20% 14%;
    --primary: 163 100% 20%;
    --primary-foreground: 0 0% 100%;
    --secondary: 40 33% 92%;
    --secondary-foreground: 163 20% 14%;
    --muted: 40 33% 92%;
    --muted-foreground: 163 10% 40%;
    --accent: 40 33% 92%;
    --accent-foreground: 163 20% 14%;
    --destructive: 0 72% 41%;
    --destructive-foreground: 0 0% 98%;
    --border: 40 15% 85%;
    --input: 40 15% 85%;
    --ring: 163 100% 20%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}



@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

Create app/icon.svg for the browser-tab icon:

`app/icon.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#00684A"/>
  <path d="M21 16h22v34L32 42 21 50Z" fill="#FAF7F0"/>
</svg>
```

### Create the add form

We can now connect the actions to the interface. Create components/bookmark-form.tsx for the add form. This Client Component calls createBookmarkAction and displays the field errors and status message it returns:

`components/bookmark-form.tsx` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/components/bookmark-form.tsx))

```tsx
"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { createBookmarkAction } from "@/app/actions";
import { emptyActionState } from "@/lib/bookmark-types";

const inputClasses =
  "w-full rounded-lg border border-[#1C2B26]/15 bg-white px-3 py-2 text-sm text-[#1C2B26] shadow-sm placeholder:text-[#1C2B26]/40 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00684A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F0] " +
  "aria-[invalid=true]:border-[#B3261E] disabled:opacity-60";

const buttonClasses =
  "inline-flex h-10 items-center justify-center rounded-lg bg-[#00684A] px-4 text-sm font-semibold text-white shadow-sm " +
  "transition-colors hover:bg-[#005238] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00684A] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F0] disabled:cursor-not-allowed disabled:opacity-60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClasses}>
      {pending ? "Saving…" : "Add bookmark"}
    </button>
  );
}

export function BookmarkForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createBookmarkAction,
    emptyActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // A successful create returns empty values; clear the fields so the form
  // is ready for the next bookmark. Rejected submissions keep the values.
  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.replace("/", { scroll: false });
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="mt-4 space-y-4" aria-busy={isPending} noValidate>
      <div className="space-y-1.5">
        <label
          htmlFor="create-title"
          className="block text-sm font-medium text-[#1C2B26]"
        >
          Title
        </label>
        <input
          id="create-title"
          name="title"
          type="text"
          autoComplete="off"
          readOnly={isPending}
          defaultValue={state.values.title}
          aria-invalid={state.fieldErrors.title ? true : undefined}
          aria-describedby={
            state.fieldErrors.title ? "create-title-error" : undefined
          }
          className={inputClasses}
        />
        {state.fieldErrors.title ? (
          <p id="create-title-error" className="text-sm text-[#B3261E]">
            {state.fieldErrors.title}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="create-url"
          className="block text-sm font-medium text-[#1C2B26]"
        >
          URL
        </label>
        <input
          id="create-url"
          name="url"
          type="url"
          autoComplete="off"
          readOnly={isPending}
          defaultValue={state.values.url}
          aria-invalid={state.fieldErrors.url ? true : undefined}
          aria-describedby={
            state.fieldErrors.url ? "create-url-error" : undefined
          }
          className={inputClasses}
        />
        {state.fieldErrors.url ? (
          <p id="create-url-error" className="text-sm text-[#B3261E]">
            {state.fieldErrors.url}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="create-note"
          className="block text-sm font-medium text-[#1C2B26]"
        >
          Note <span className="font-normal text-[#4B5F58]">(optional)</span>
        </label>
        <textarea
          id="create-note"
          name="note"
          rows={3}
          readOnly={isPending}
          defaultValue={state.values.note}
          aria-invalid={state.fieldErrors.note ? true : undefined}
          aria-describedby={
            state.fieldErrors.note ? "create-note-error" : undefined
          }
          className={inputClasses}
        />
        {state.fieldErrors.note ? (
          <p id="create-note-error" className="text-sm text-[#B3261E]">
            {state.fieldErrors.note}
          </p>
        ) : null}
      </div>

      <SubmitButton />

      {state.status !== "idle" && state.message ? (
        <p
          aria-live="polite"
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm font-medium text-[#B3261E]"
              : "text-sm font-medium text-[#00684A]"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
```

useActionState gives the component the latest action result, the function used by the form’s action prop, and an isPending flag. During submission, the fields become read-only so their contents stay aligned with the values being saved. SubmitButton sits inside the form, where useFormStatus can read its pending state. The button is disabled and displays “Saving…” until the request finishes.

On a successful save, the effect clears the form and uses router.replace("/") to return to the newest page. You’ll therefore see the new bookmark even if you added it while browsing older entries. A rejected or unconfirmed submission keeps your values in the form. noValidate disables the browser’s built-in validation UI so the server’s field messages appear consistently; validation still runs on the server either way.

### Add editing and delete confirmation

Each saved bookmark needs a view mode, an edit form and a delete confirmation. Create components/bookmark-item.tsx with the code below to switch between those states:

`components/bookmark-item.tsx` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/components/bookmark-item.tsx))

```tsx
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { deleteBookmarkAction, updateBookmarkAction } from "@/app/actions";
import type { BookmarkView } from "@/lib/bookmark-types";
import { emptyActionState } from "@/lib/bookmark-types";

const inputClasses =
  "w-full rounded-lg border border-[#1C2B26]/15 bg-white px-3 py-2 text-sm text-[#1C2B26] shadow-sm placeholder:text-[#1C2B26]/40 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00684A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F0] " +
  "aria-[invalid=true]:border-[#B3261E] disabled:opacity-60";

const secondaryButtonClasses =
  "inline-flex h-8 items-center rounded-lg border border-[#1C2B26]/15 bg-white px-3 text-xs font-semibold text-[#1C2B26] " +
  "transition-colors hover:bg-[#1C2B26]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00684A] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F0] disabled:cursor-not-allowed disabled:opacity-60";

const deleteButtonClasses =
  "inline-flex h-8 items-center rounded-lg border border-[#B3261E]/30 bg-white px-3 text-xs font-semibold text-[#B3261E] " +
  "transition-colors hover:bg-[#B3261E]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B3261E] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F0] disabled:cursor-not-allowed disabled:opacity-60";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

function SaveEditButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-lg bg-[#00684A] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#005238] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00684A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F0] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

function ConfirmDeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={deleteButtonClasses}>
      {pending ? "Deleting…" : "Confirm delete"}
    </button>
  );
}

function EditBookmarkForm({
  bookmark,
  onDone,
}: {
  bookmark: BookmarkView;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updateBookmarkAction,
    emptyActionState,
  );
  const previousStatus = useRef(state.status);

  // A successful edit exits edit mode; rejected submissions stay open.
  useEffect(() => {
    if (state.status === "success" && previousStatus.current !== "success") {
      onDone();
    }
    previousStatus.current = state.status;
  }, [state, onDone]);

  return (
    <form action={formAction} className="mt-3 space-y-3" aria-busy={isPending} noValidate>
      <input type="hidden" name="id" value={bookmark.id} />
      <div className="space-y-1.5">
        <label
          htmlFor={`edit-title-${bookmark.id}`}
          className="block text-sm font-medium text-[#1C2B26]"
        >
          Title
        </label>
        <input
          id={`edit-title-${bookmark.id}`}
          name="title"
          type="text"
          autoComplete="off"
          readOnly={isPending}
          defaultValue={state.status === "idle" ? bookmark.title : state.values.title}
          aria-invalid={state.fieldErrors.title ? true : undefined}
          aria-describedby={
            state.fieldErrors.title ? `edit-title-error-${bookmark.id}` : undefined
          }
          className={inputClasses}
        />
        {state.fieldErrors.title ? (
          <p id={`edit-title-error-${bookmark.id}`} className="text-sm text-[#B3261E]">
            {state.fieldErrors.title}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`edit-url-${bookmark.id}`}
          className="block text-sm font-medium text-[#1C2B26]"
        >
          URL
        </label>
        <input
          id={`edit-url-${bookmark.id}`}
          name="url"
          type="url"
          autoComplete="off"
          readOnly={isPending}
          defaultValue={state.status === "idle" ? bookmark.url : state.values.url}
          aria-invalid={state.fieldErrors.url ? true : undefined}
          aria-describedby={
            state.fieldErrors.url ? `edit-url-error-${bookmark.id}` : undefined
          }
          className={inputClasses}
        />
        {state.fieldErrors.url ? (
          <p id={`edit-url-error-${bookmark.id}`} className="text-sm text-[#B3261E]">
            {state.fieldErrors.url}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`edit-note-${bookmark.id}`}
          className="block text-sm font-medium text-[#1C2B26]"
        >
          Note <span className="font-normal text-[#4B5F58]">(optional)</span>
        </label>
        <textarea
          id={`edit-note-${bookmark.id}`}
          name="note"
          rows={3}
          readOnly={isPending}
          defaultValue={state.status === "idle" ? bookmark.note : state.values.note}
          aria-invalid={state.fieldErrors.note ? true : undefined}
          aria-describedby={
            state.fieldErrors.note ? `edit-note-error-${bookmark.id}` : undefined
          }
          className={inputClasses}
        />
        {state.fieldErrors.note ? (
          <p id={`edit-note-error-${bookmark.id}`} className="text-sm text-[#B3261E]">
            {state.fieldErrors.note}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <SaveEditButton />
        <button type="button" disabled={isPending} onClick={onDone} className={secondaryButtonClasses}>
          Cancel
        </button>
      </div>

      {state.status !== "idle" && state.message ? (
        <p
          aria-live="polite"
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "text-sm font-medium text-[#B3261E]"
              : "text-sm font-medium text-[#00684A]"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function BookmarkItem({ bookmark }: { bookmark: BookmarkView }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteState, deleteFormAction, isDeleting] = useActionState(
    deleteBookmarkAction,
    emptyActionState,
  );

  const wasUpdated = bookmark.updatedAt !== bookmark.createdAt;

  return (
    <li className="rounded-2xl border border-[#1C2B26]/10 bg-white p-4 shadow-sm">
      {isEditing ? (
        <EditBookmarkForm bookmark={bookmark} onDone={() => setIsEditing(false)} />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words font-semibold text-[#00684A] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00684A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F0]"
              >
                {bookmark.title}
              </a>
              <p className="mt-0.5 truncate text-sm text-[#4B5F58]">
                {bookmark.url}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => { setIsConfirmingDelete(false); setIsEditing(true); }}
                disabled={isDeleting}
                className={secondaryButtonClasses}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isDeleting}
                className={deleteButtonClasses}
              >
                Delete
              </button>
            </div>
          </div>

          {bookmark.note ? (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#1C2B26]">
              {bookmark.note}
            </p>
          ) : null}

          <p className="mt-2 text-xs text-[#4B5F58]">
            Added {formatDate(bookmark.createdAt)}
            {wasUpdated ? ` · Updated ${formatDate(bookmark.updatedAt)}` : ""}
          </p>

          {isConfirmingDelete ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#1C2B26]/10 pt-3">
              <form action={deleteFormAction} className="flex flex-wrap items-center gap-2" noValidate>
                <input type="hidden" name="id" value={bookmark.id} />
                <span className="text-xs font-medium text-[#1C2B26]">
                  Delete this bookmark?
                </span>
                <ConfirmDeleteButton />
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  disabled={isDeleting}
                  className={secondaryButtonClasses}
                >
                  Cancel
                </button>
              </form>
            </div>
          ) : null}

          {deleteState.status === "error" && deleteState.message ? (
            <p aria-live="polite" role="alert" className="mt-2 text-sm font-medium text-[#B3261E]">
              {deleteState.message}
            </p>
          ) : null}
        </>
      )}
    </li>
  );
}
```

The edit form includes the bookmark ID in a hidden field and starts with its current title, URL and note. Saving successfully closes the editor; Cancel closes it without submitting. While a write is pending, the fields stay read-only and Cancel is disabled.

Delete opens the confirmation state first. Confirm delete submits the action, while Cancel returns to the normal card. The card renders notes as React text, so text that looks like HTML is still displayed as text. Links open in a new tab with noopener and noreferrer.

### Read the list in the page

The components are ready. Replace app/page.tsx with the page below to read the bookmarks on the server and pass them to the interactive components:

`app/page.tsx` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/app/page.tsx))

```tsx
import { connection } from "next/server";

import { BookmarkForm } from "@/components/bookmark-form";
import { BookmarkItem } from "@/components/bookmark-item";
import {
  listBookmarks,
} from "@/db/bookmarks";
import type { BookmarkView } from "@/lib/bookmark-types";
import Link from "next/link";

// MongoDB is reached from Node.js server code only.
export const runtime = "nodejs";

// The page reads the database on every request; never connect during a
// static build.

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ before?: string | string[] }>;
}) {
  // Marks the page dynamic and waits for a request connection, so the
  // database is only queried for real visitors, never at build time.
  await connection();

  let bookmarks: BookmarkView[] = [];
  const { before } = await searchParams;
  let nextCursor: string | null = null;
  let isOlderPage = false;
  let isDatabaseUnavailable = false;

  try {
    const result = await listBookmarks(before);
    bookmarks = result.bookmarks;
    nextCursor = result.nextCursor;
    isOlderPage = result.isOlderPage;
  } catch {
    // Distinguish "database down" from "empty database" for the visitor.
    // Do not log raw driver errors or connection details here.
    console.error("Failed to read bookmarks from the database.");
    isDatabaseUnavailable = true;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#1C2B26]">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Bookmarks
            </h1>
            <p className="mt-2 text-base text-[#4B5F58]">
              A small place for links worth keeping.
            </p>
          </div>
        </header>

        <main className="mt-8 grid items-start gap-8 lg:grid-cols-[21rem_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[#1C2B26]/10 bg-white p-5 shadow-sm lg:sticky lg:top-8">
            <h2 className="text-lg font-semibold">Add a bookmark</h2>
            <p className="mt-1 text-sm text-[#4B5F58]">
              Save a link with a title and an optional note.
            </p>
            <BookmarkForm />
          </aside>

          <section aria-label="Saved bookmarks" className="min-w-0">
            {isDatabaseUnavailable ? (
              <div
                role="alert"
                className="rounded-2xl border border-[#B3261E]/30 bg-[#B3261E]/5 p-6"
              >
                <h2 className="text-lg font-semibold text-[#8C1D18]">
                  Couldn’t load bookmarks
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#8C1D18]">
                  Please try again in a moment.
                </p>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#1C2B26]/20 bg-white/60 p-8 text-center">
                <h2 className="text-lg font-semibold">
                  {isOlderPage ? "No older bookmarks" : "No bookmarks yet"}
                </h2>
                <p className="mt-2 text-sm text-[#4B5F58]">
                  {isOlderPage
                    ? "You’ve reached the end of the list."
                    : "Add your first link with the form on this page."}
                </p>
              </div>
            ) : (
              <>
                <ul className="space-y-3">
                  {bookmarks.map((bookmark) => (
                    <BookmarkItem key={bookmark.id} bookmark={bookmark} />
                  ))}
                </ul>
              </>
            )}
            {!isDatabaseUnavailable && (isOlderPage || nextCursor) ? (
              <nav aria-label="Bookmark pages" className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                {isOlderPage ? (
                  <Link href="/" className="rounded-lg px-3 py-2 font-medium text-[#00684A] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00684A]">
                    Back to newest
                  </Link>
                ) : <span />}
                {nextCursor ? (
                  <Link href={`/?${new URLSearchParams({ before: nextCursor })}`} className="rounded-lg border border-[#1C2B26]/15 bg-white px-3 py-2 font-medium text-[#00684A] hover:bg-[#1C2B26]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00684A]">
                    Older bookmarks
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </section>
        </main>

      </div>
    </div>
  );
}
```

await [connection()](https://nextjs.org/docs/app/api-reference/functions/connection) waits for an incoming request before reading MongoDB, so the query won’t run during the build. The before query parameter tells listBookmarks() where to start, and its returned cursor becomes the “Older bookmarks” link. “Back to newest” removes that cursor. The page also distinguishes three outcomes: a failed read shows “Couldn’t load bookmarks”; an empty first page shows “No bookmarks yet”; and an older page with no remaining records shows “No older bookmarks” with a way back.

We’ve replaced the starter page, so its connection-status helper and original branding assets are no longer used. Remove them with the command below. Next.js will use the app/icon.svg file we created above:

```bash
rm db/connection-status.ts app/favicon.ico app/fonts.js public/og.png \
  assets/logo.svg assets/logo-dark.svg \
  assets/vercel-logotype-dark.svg assets/vercel-logotype-light.svg
```

### Try the bookmark app

Start Next.js again from the project root:

```bash
nvm use
npm run dev -- --hostname 127.0.0.1
```

Open http://127.0.0.1:3000 and save a link to the [MongoDB Node.js driver documentation](https://www.mongodb.com/docs/drivers/node/current/). Add a note such as “Keep this open while writing queries.” You should see the new bookmark in the list and an empty form ready for another link.

Reload the page to read the bookmark back from MongoDB. It should still be there. Add a second link, edit the first note, and reload again to check the change. Then try Delete, cancel once, and finally confirm the deletion. The remaining bookmark should stay unchanged.

Also try a blank title or a URL such as example.com, without an http:// or https:// prefix. The form should explain what needs fixing and keep the values you entered. These quick checks help catch mistakes before we add an automated test.

## Add a Playwright test

Let’s turn the deletion flow into a browser test. We want to check the result in MongoDB as well as on the page: cancelling should leave the document intact, confirming should remove it, and reloading should still show an empty list.

The test will delete its sample bookmarks, so it needs a separate database. The runner below starts temporary MongoDB, creates a unique test database and starts its own Next.js server. It overrides MONGODB_URI so the test cannot use the database in your .env file. When the run ends, it stops the processes. Stop your development server with Ctrl+C before running these checks.

Add the verification commands to package.json, then remove the starter test, which checks the original template page:

```bash
npm pkg set scripts.typecheck="tsc --noEmit" \
  scripts.verify="node scripts/verify.mjs" \
  scripts.verify:dev="node scripts/verify.mjs --dev" \
  scripts.test="npm run verify"
rm tests/e2e/home.spec.ts
```

Create scripts/verify.mjs with the complete runner below. It runs the app in production or development mode and checks three database states: working, missing a connection string, and unreachable.

`scripts/verify.mjs`

```javascript
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { MongoMemoryServer } from "mongodb-memory-server-core";

const dev = process.argv.includes("--dev");
const children = new Set();
let mongo;
// Empty values override Next's .env files; no database credentials are read.
const cleanEnv = { ...process.env, MONGODB_URI: "", BOOKMARKS_TEST_RUN: "1", NEXT_TELEMETRY_DISABLED: "1" };
function child(command, args, env) {
  const proc = spawn(command, args, { env, stdio: "inherit", detached: true });
  children.add(proc);
  return proc;
}
async function run(command, args, env = cleanEnv) {
  const proc = child(command, args, env);
  try {
    await new Promise((resolve, reject) => {
      proc.once("error", reject);
      proc.once("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} failed (${code ?? signal})`)));
    });
  } finally { await stop(proc); }
}
async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function stop(proc) {
  children.delete(proc);
  // Completed commands no longer own a live process group. In particular,
  // do not signal a departed child's numeric PID after the OS can reuse it.
  if (!proc.pid || proc.exitCode !== null || proc.signalCode !== null) return;
  // Includes Next's workers, rather than only npm's wrapper process.
  try { process.kill(-proc.pid, "SIGTERM"); } catch (error) { if (error.code !== "ESRCH") throw error; }
  const deadline = Date.now() + 5000;
  while (proc.exitCode === null && proc.signalCode === null && Date.now() < deadline) await delay(50);
  if (proc.exitCode === null && proc.signalCode === null) {
    try { process.kill(-proc.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
  }
}
async function ready(server, baseURL) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error("Owned Next server exited before readiness.");
    try {
      const response = await fetch(baseURL, { signal: AbortSignal.timeout(12_000) });
      if (response.ok) return;
    } catch { /* Startup/dev compilation may require several attempts. */ }
    await delay(250);
  }
  throw new Error("Owned Next server did not become ready.");
}
let cleaning;
function cleanup() {
  return cleaning ??= (async () => {
    for (const proc of [...children]) await stop(proc);
    if (mongo) await mongo.stop();
  })();
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => { await cleanup(); process.exit(signal === "SIGINT" ? 130 : 143); });
}
try {
  if (!dev) for (const script of ["lint", "typecheck", "build"]) await run("npm", ["run", script]);
  const dbName = `bookmarks_test_${randomUUID().replaceAll("-", "")}`;
  mongo = await MongoMemoryServer.create({ binary: { version: "8.2.6" }, instance: { ip: "127.0.0.1", dbName } });
  const uri = mongo.getUri(dbName);
  await run("npm", ["run", "db:setup"], { ...cleanEnv, MONGODB_URI: uri });
  const unavailablePort = await freePort();
  for (const [scenario, databaseURI] of [
    ["healthy", uri],
    ["missing", ""],
    ["unreachable", `mongodb://127.0.0.1:${unavailablePort}/${dbName}`],
  ]) {
    const port = await freePort();
    const baseURL = `http://127.0.0.1:${port}`;
    const env = { ...cleanEnv, MONGODB_URI: databaseURI, BOOKMARKS_TEST_URI: uri, BOOKMARKS_TEST_SCENARIO: scenario, BOOKMARKS_TEST_BASE_URL: baseURL };
    console.log(`Verifying ${dev ? "development" : "production"} runtime: ${scenario}`);
    const server = child("node", ["node_modules/next/dist/bin/next", dev ? "dev" : "start", "--hostname", "127.0.0.1", "--port", String(port)], env);
    try {
      await ready(server, baseURL);
      await run("node", ["node_modules/@playwright/test/cli.js", "test"], env);
    } finally { await stop(server); }
  }
} finally { await cleanup(); }

```

Replace playwright.config.ts with this configuration. It accepts only the loopback server started by the runner and runs one Chromium test at a time.

`playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

if (process.env.BOOKMARKS_TEST_RUN !== "1") throw new Error("Use the isolated verification harness.");
const baseURL = process.env.BOOKMARKS_TEST_BASE_URL;
if (!baseURL || !/^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL)) throw new Error("An owned loopback server is required.");
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  outputDir: `test-results/${process.env.BOOKMARKS_TEST_SCENARIO}`,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: `playwright-report/${process.env.BOOKMARKS_TEST_SCENARIO}` }]],
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // The harness owns startup/shutdown. Never reuse a developer's server.
});

```

Create tests/e2e/bookmarks.spec.ts with this complete test file. Alongside the database setup, helpers and deletion test, it includes a failure-state test for the runner’s missing and unreachable database scenarios:

`tests/e2e/bookmarks.spec.ts` ([source](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/tests/e2e/bookmarks.spec.ts))

```typescript
import { test, expect, type Page } from "@playwright/test";
import { MongoClient, type Collection, type Document } from "mongodb";

if (process.env.BOOKMARKS_TEST_RUN !== "1")
  throw new Error("Disposable test run required.");
const rawURI = process.env.BOOKMARKS_TEST_URI;
if (!rawURI) throw new Error("Missing disposable database URI.");
const parsedURI = new URL(rawURI);
if (
  parsedURI.protocol !== "mongodb:" ||
  parsedURI.hostname !== "127.0.0.1" ||
  !/^\/bookmarks_test_[a-zA-Z0-9_]+$/.test(parsedURI.pathname) ||
  parsedURI.username ||
  parsedURI.password
) {
  throw new Error("Tests may only mutate a loopback bookmarks_test_ database.");
}
const scenario = process.env.BOOKMARKS_TEST_SCENARIO;
if (!["healthy", "missing", "unreachable"].includes(scenario ?? ""))
  throw new Error("Unknown verification scenario.");
const healthy = scenario === "healthy";
if (healthy && process.env.MONGODB_URI !== rawURI)
  throw new Error("Application and tests must share the disposable database.");
let client: MongoClient;
let bookmarks: Collection<Document>;
test.beforeAll(async () => {
  client = await new MongoClient(rawURI, {
    serverSelectionTimeoutMS: 5000,
  }).connect();
  bookmarks = client.db().collection("bookmarks");
});
test.afterAll(async () => {
  await client?.close();
});
test.beforeEach(async () => {
  await bookmarks.deleteMany({});
});

function createForm(page: Page) {
  return page
    .locator("form")
    .filter({
      has: page.locator("#create-title"),
    });
}
async function add(
  page: Page,
  title: string,
  url = "https://example.com",
  note = "",
) {
  const form = createForm(page);
  await form.getByLabel("Title", { exact: true }).fill(title);
  await form.getByLabel("URL", { exact: true }).fill(url);
  await form.getByLabel(/Note/).fill(note);
  await form.getByRole("button", { name: "Add bookmark", exact: true }).click();
  return form;
}
function item(page: Page, title: string) {
  return page
    .getByRole("listitem")
    .filter({ has: page.getByRole("link", { name: title, exact: true }) });
}
async function seed(title = "Seed bookmark", extra: Document = {}) {
  const now = new Date("2025-01-01T12:00:00.000Z");
  const doc = {
    title,
    url: "https://example.com",
    note: "Original note",
    createdAt: now,
    updatedAt: now,
    ...extra,
  };
  const result = await bookmarks.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

test.describe("healthy database", () => {
  test.skip(!healthy, "Only run against the healthy disposable database.");

  test("delete requires confirmation and cancel leaves the document intact", async ({
    page,
  }) => {
    const original = await seed();
    await page.goto("/");
    const card = item(page, original.title);
    await card.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(
      card.getByText("Delete this bookmark?", { exact: true }),
    ).toBeVisible();
    await card.getByRole("button", { name: "Cancel", exact: true }).click();
    expect(await bookmarks.countDocuments()).toBe(1);
    await card.getByRole("button", { name: "Delete", exact: true }).click();
    await card
      .getByRole("button", { name: "Confirm delete", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "No bookmarks yet" }),
    ).toBeVisible();
    expect(await bookmarks.countDocuments()).toBe(0);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "No bookmarks yet" }),
    ).toBeVisible();
  });
});

test.describe("database unavailable", () => {
  test.skip(healthy, "Run in both missing and unreachable URI scenarios.");
  test("shows an outage rather than empty data, and retains rejected mutation input", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Couldn’t load bookmarks", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No bookmarks yet" }),
    ).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(
      /MONGODB_URI|MongoServerSelectionError|mongodb:\/\//,
    );
    const form = await add(
      page,
      "Preserve my bookmark",
      "https://example.com/outage",
      "Retry later",
    );
    await expect(form.getByRole("alert")).toContainText(
      /Could not confirm that the bookmark was saved/,
    );
    await expect(form.getByLabel("Title", { exact: true })).toHaveValue(
      "Preserve my bookmark",
    );
    await expect(form.getByLabel("URL", { exact: true })).toHaveValue(
      "https://example.com/outage",
    );
    await expect(form.getByLabel(/Note/)).toHaveValue("Retry later");
    expect(await bookmarks.countDocuments()).toBe(0);
  });
});
```

The setup accepts only database URLs on loopback with a bookmarks_test_ name, then clears that disposable collection before each test. The create-form helper finds the form by its title field, which remains available when the button changes to “Saving…”. The deletion test checks both the page and the stored document count. The failure test checks that a failed read is shown as an error and that an unconfirmed save leaves the entered values in place.

Install Chromium and run the checks from the project root:

```bash
npx playwright install --with-deps chromium
npm run verify
npm run verify:dev
```

verify runs ESLint and TypeScript, builds the app without a database connection string, then runs the browser checks against its temporary database. It also checks the missing-connection-string and unreachable-database states. verify:dev repeats the browser checks with Next.js running in development mode. Each command uses its own database, keeping the fixtures separate from your Atlas collection and local bookmark list. Use these runners rather than executing the test file directly.

The runner uses POSIX process groups and is intended for macOS or Linux. The first run downloads MongoDB and Chromium; installing browser dependencies on Linux may require administrator access. If you want to extend this small suite, the optional finished repository includes [additional tests](https://github.com/Eronmmer/mongodb-bookmarks-tutorial/blob/07361f2c747a9e05be119c69f2582f59306fbabd/tests/e2e/bookmarks.spec.ts) for repeated creates, edits, invalid IDs, pending forms and pagination across tied timestamps.

### Run the checks on GitHub

The template includes a GitHub Actions workflow for its original app. Replace .github/workflows/ci.yml with this version before pushing your bookmark project. It uses the Node version in .nvmrc and runs the same isolated verification command on pushes to bookmarks or main and on pull requests. It needs no Atlas connection string or database credentials; the runner creates disposable data for each run.

`.github/workflows/ci.yml (YAML)`

```yaml
name: CI

on:
  push:
    branches: ["bookmarks", "main"]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  build-and-e2e:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 # v7.0.0

      - name: Setup Node.js
        uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6.4.0
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browser
        run: npx playwright install --with-deps chromium

      - name: Verify production build and browser flows
        run: npm run verify

      - name: Upload Playwright report
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
          if-no-files-found: ignore


```

After pushing your repository, open its Actions tab to check the run. If a browser test fails, the workflow uploads a Playwright report to help you inspect the result.

## Deploy the app to Vercel

[Create an empty repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository) in your own GitHub account for the app. Leave the README, licence and .gitignore options unchecked, since those files are already in the project, and copy the new repository’s HTTPS URL.

Remove the template’s CODEOWNERS file, which names its upstream maintainers. The origin remote still points to MongoDB’s template. Rename it to upstream, then add your own repository as origin. In the example URL below, replace YOUR_USERNAME and bookmarks-build with your repository details:

```bash
rm .github/CODEOWNERS
git remote rename origin upstream
git remote add origin https://github.com/YOUR_USERNAME/bookmarks-build.git
git add .
git commit -m "Build the bookmarks app"
git push -u origin bookmarks
```

Import your new repository into Vercel and select the bookmarks branch. Importing the completed repository gives Vercel the bookmark app you’ve built; the starter template’s deploy button would create the starter application.

### Restrict access before connecting the database

The deployed app will share one bookmark list, so configure Vercel Authentication before adding working database credentials. Go to Project → Settings → [Deployment Protection](https://vercel.com/docs/deployment-protection) and select All Deployments. Check for protection exceptions and share-link bypasses as well. Standard Protection leaves production domains public.

### Set the connection string

In the Vercel project, open Environment Variables and choose Add Environment Variable. Select Secret, use MONGODB_URI as the key, paste the Atlas connection string as the value, and select Production. Add a separate Preview value only if you use preview deployments. The temporary localhost database runs only on your development machine, so it cannot serve this deployment. Prefer separate databases for Production and Preview so preview changes won’t alter the production list. Complete the network and index setup below before deploying. [Environment-variable changes](https://vercel.com/docs/environment-variables) take effect in new deployments, so redeploy whenever you edit them.

The connection also needs to be allowed from Vercel’s outbound network. Vercel uses dynamic outbound IPs by default; follow its [allowlisting guidance](https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address) for the networking option you choose. Your app’s public domain IP is different from the outbound address used to reach Atlas.

If you deliberately use Atlas’s 0.0.0.0/0 entry for this exercise, it allows connection attempts from anywhere. Use strong credentials with access limited to the bookmark database. Vercel’s login gate protects the web app; it does not restrict direct connections to the database port.

### Prepare the hosted database

Before deploying, prepare the destination Atlas database from a trusted terminal in the project directory. Set MONGODB_URI to that database in the terminal environment or your local .env file, allow the terminal host’s outbound IP in Atlas, and run:

```bash
nvm use
npm run db:setup
```

Wait for “Bookmark index is ready.” Repeat the command with the URI for each separate Production and Preview database. The app does not create indexes during requests, so prepare the target databases before deploying the project on Vercel. If you changed your local .env for this step, restore the URI you want for local development before restarting Next.js.

### Check the deployed app

Open the production, preview and generated deployment URLs in a signed-out browser. Each should require authentication before displaying the bookmark page. Then sign in as an allowed visitor and repeat the create, reload, edit and delete flow before sharing the app.

## Where to go next

You’ve turned the template into a bookmark app that reads and writes MongoDB documents, validates form submissions and lets you browse older entries. The Server Component reads the list, Server Actions handle the writes, and Playwright checks what happens in the browser.

A useful next addition would be tags for grouping related links, or a search field for finding a bookmark by its title or note. The [companion repository](https://github.com/Eronmmer/mongodb-bookmarks-tutorial) is an optional reference for the finished app and additional tests; none of its files are needed to complete this build.
