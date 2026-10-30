# Build a Bookmark App With Next.js and MongoDB

That documentation tab has been open since Tuesday. You’re done with it for now, but closing it feels like losing something you’ll need again. Let’s give that link a home, along with a note about why it’s worth keeping.

We’ll build a bookmark app with Next.js and MongoDB. You’ll save a link, reload the page to check it stuck, then add editing and deletion. Along the way, we’ll follow that bookmark from the form to MongoDB and back to the screen. By the end, you’ll also have browser tests and a deployed app.

## What we’re building

One page, a few fields, and somewhere to put those links. Each bookmark has a title, URL and optional note. You can edit it in place, cancel a deletion, or confirm that you’re done with it. The finished list also lets you browse older bookmarks, 100 at a time.

![The finished bookmark app](images/bookmarks-desktop.png)

We’ll start with [MongoDB’s Next.js template](https://github.com/mongodb-developer/nextjs-template-mongodb). All the code you need is included here, so you can build the app from that public template without downloading files from a companion repository.

This version has one bookmark list and no application sign-in. Anyone with access to the app can read and change that list. We’ll keep the hosted app behind Vercel’s access controls and use public example links while building.

## Before you start

You’ll be comfortable with this tutorial if you’ve used React components, props and forms, and can read basic TypeScript. We’ll explain the Next.js server conventions and MongoDB operations as we use them. The terminal commands assume a macOS or Linux shell.

First choose where to run the code: your computer or GitHub Codespaces. Then choose where to store the data: MongoDB Atlas or a temporary MongoDB process alongside the app. These choices are independent. Codespaces can use either database, just as your computer can.

Atlas keeps your bookmarks after you stop the app. The temporary database is handy for following along, but stopping its process deletes its data. For deployment, we’ll use Atlas.

## Open the MongoDB template

### On your computer

Install [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org/en/download) 24.22.1, then clone the template:

```bash
git clone https://github.com/mongodb-developer/nextjs-template-mongodb.git bookmarks-build
cd bookmarks-build
git switch -c bookmarks 09278fa9369ce03c3e988156351655f87317ecf6
```

The long commit ID selects the template revision used to test this tutorial. That gives us the same starting files even if the template changes later. `bookmarks` is simply the name of your working branch.

### Or use GitHub Codespaces

Open the [official template repository](https://github.com/mongodb-developer/nextjs-template-mongodb) and choose **Code → Codespaces → Create codespace**. Select the 2-core machine. Check your account’s included allowance and spending settings first if you need to stay within the free allowance.

Once the editor opens, use its terminal to select the same template revision. A Codespaces prebuild may start from an older revision, so fetch before switching:

```bash
git fetch origin
git switch -c bookmarks 09278fa9369ce03c3e988156351655f87317ecf6
```

Replace `.devcontainer/devcontainer.json` with the configuration below. It gives us a Debian Bookworm environment with Node 24 and forwards port 3000. Then open the Command Palette and choose **Codespaces: Rebuild Container**. Wait for the rebuild before continuing.

`.devcontainer/devcontainer.json`

```json
{
  "name": "mongodb-bookmarks-tutorial",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:24-bookworm",
  "postCreateCommand": "npm ci",
  "forwardPorts": [
    3000
  ],
  "portsAttributes": {
    "3000": {
      "label": "Bookmarks",
      "onAutoForward": "notify"
    }
  }
}
```

From here, both routes use the same commands in the project terminal. In Codespaces, open the running app through port 3000 in the **Ports** panel and leave its visibility set to **Private**. On your computer, use `http://127.0.0.1:3000`.

## Install the tested dependencies

The template already includes Next.js, React, TypeScript, Tailwind CSS, the MongoDB driver and Playwright. Let’s install its locked dependencies first, then update the versions we’ll use for this build.

Create `.nvmrc` and select Node 24.22.1. If you installed Node without [nvm](https://github.com/nvm-sh/nvm#installing-and-updating), skip the `nvm` commands throughout the tutorial and check that `node --version` prints `v24.22.1`.

```bash
printf '24.22.1\n' > .nvmrc
nvm install
nvm use
node --version
npm ci
```

The template snapshot has older packages. These commands bring in the [patched Next.js release](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) used here and keep its ESLint configuration aligned. Two additions serve specific purposes: `server-only` catches accidental imports of database modules into client code, and `mongodb-memory-server-core` starts a temporary MongoDB process for development and tests.

```bash
npm install --save-exact next@16.4.3 react@19.2.7 react-dom@19.2.7 \
  mongodb@7.5.0 server-only@0.0.1
npm install --save-dev --save-exact @playwright/test@1.61.1 \
  mongodb-memory-server-core@11.3.0 eslint-config-next@16.4.3
npm update
npm pkg set 'engines.node=24.x'
```

The numbers record the releases tested together. `--save-exact` saves those versions in `package.json`, while [`npm update`](https://docs.npmjs.com/cli/v11/commands/npm-update/) refreshes other packages within their allowed ranges. Keep `package.json` and `package-lock.json` in Git. After this setup, use `npm ci` to reinstall what your lockfile records.

Add the commands for our database helpers and create their directory. We’ll write the local helper now and the index helper when we add pagination:

```bash
mkdir -p scripts
npm pkg set \
  'scripts.db:local=node scripts/local-db.mjs' \
  'scripts.db:setup=node --env-file-if-exists=.env scripts/setup-db.mjs'
```

Replace `.env.example` with this local connection setting:

`.env.example`

```bash
MONGODB_URI=mongodb://127.0.0.1:27028/bookmark_app
```

That example has no password. Replace the template’s `.env` entry in `.gitignore` with these two lines, then copy `.env.example` to `.env`:

`.gitignore`

```bash
.env*
!.env.example
```

```bash
cp .env.example .env
```

## Connect the starter to MongoDB

### Use MongoDB Atlas

[Create an Atlas account](https://www.mongodb.com/cloud/atlas/register?utm_campaign=devrel&utm_source=content&utm_medium=cta&utm_content=nextjs.template.example&utm_term=learning.fuel), then create or select a project and a Free cluster. Add a [database user](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/) with `readWrite` access to `bookmark_app`. This is the identity the app connects as, separate from your Atlas sign-in account.

In [Network Access](https://www.mongodb.com/docs/atlas/security/ip-access-list/), allow the public outbound IP of the machine running Node.js. For local development, that is usually your computer’s public IP. For Codespaces, use the Codespace’s outbound IP and recheck it after a restart.

Choose [Connect → Drivers → Node.js](https://www.mongodb.com/docs/atlas/driver-connection/). Copy the `mongodb+srv://` URI into `MONGODB_URI` in `.env`, fill in the database username and password, and put `bookmark_app` between the final slash and the query string. Keep the options Atlas supplies. The database portion should read `/bookmark_app?`, followed by those options.

[Percent-encode reserved characters](https://www.mongodb.com/docs/manual/reference/connection-string-formats/) in the credentials. Keep `.env` out of Git, and keep the name `MONGODB_URI`. A [`NEXT_PUBLIC_` prefix](https://nextjs.org/docs/app/guides/environment-variables) would make a referenced value available to browser code.

### Or run a temporary database

For the temporary option, leave `.env` set to `mongodb://127.0.0.1:27028/bookmark_app`. Create `scripts/local-db.mjs` with this helper:

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

This starts a real MongoDB 8.2.6 process, downloading the binary on its first run. It listens on loopback at port 27028. If that port is occupied, the helper fails rather than choosing a different port and leaving the app pointed at the wrong database.

```bash
nvm use
npm run db:local
```

Leave this terminal running. Open another terminal at the project root for the app, and run `nvm use` there too. Remember that **Ctrl+C in the database terminal deletes this session’s bookmarks**.

### Check the connection before building the form

In `lib/mongodb.ts`, replace the existing `appName` option with this value. It identifies the tutorial app in MongoDB connection metadata:

`lib/mongodb.ts`

```typescript
appName: "devrel-tutorial-javascript-nextjstemplate",
```

Use the following layout for the app’s title and system font. Replacing `app/layout.tsx` also removes the starter’s web-font download:

`app/layout.tsx`

```typescript
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

In `tailwind.config.ts`, replace the `sans` array inside `theme.extend.fontFamily` with the following line. Keep the `defaultTheme` import and the rest of the configuration:

`tailwind.config.ts`

```typescript
sans: [...defaultTheme.fontFamily.sans],
```

Replace `next.config.ts` with the following configuration. Codespaces forwards development requests with a `localhost:3000` origin, so we allow that exact origin only when both development mode and Codespaces are active. This lets the forms submit through its forwarded port without widening the production allowance. The Turbopack setting keeps this directory as the build root.

`next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Codespaces forwards port 3000 with a localhost Origin header.
  // Keep this allowance limited to its development container.
  ...(process.env.NODE_ENV === "development" &&
  process.env.CODESPACES === "true"
    ? { experimental: { serverActions: { allowedOrigins: ["localhost:3000"] } } }
    : {}),
  // Pin the Turbopack workspace root to this project to avoid incorrect root
  // inference when other lockfiles exist higher up the filesystem.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
```

Start Next.js:

```bash
nvm use
npm run dev -- --hostname 127.0.0.1
```

Open the app and look for **Database connected** on the starter page. If it is missing, check the URI and database credentials, the Atlas IP access list, or whether the temporary database is still running. Restart Next.js after changing `.env`. Getting this check green now gives us a known connection before we add our own code.

Stop Next.js with **Ctrl+C** once the connection works. Keep the temporary database running if you’re using it. We’ll restart the app when the first bookmark form and list are ready.

## Give a bookmark somewhere to live

Let’s save the MongoDB Node.js driver documentation. The URL tells us where to go, the title makes the link readable, and the note records what we wanted to revisit: “Check how insertOne returns the new document’s ID.”

MongoDB stores that bookmark as a document in the `bookmarks` collection. Here’s an illustrative document in MongoDB Extended JSON. Your generated ID and timestamps will differ:

```json
{
  "_id": { "$oid": "690000000000000000000001" },
  "title": "MongoDB Node.js driver docs",
  "url": "https://www.mongodb.com/docs/drivers/node/current/",
  "note": "Check how insertOne returns the new document’s ID.",
  "createdAt": { "$date": "2026-10-30T10:00:00.000Z" },
  "updatedAt": { "$date": "2026-10-30T10:00:00.000Z" }
}
```

`_id` identifies this particular bookmark. The driver generates it when we insert a document without one. We set both dates on the server. Later, editing the note will change `updatedAt` while preserving `createdAt`, so the bookmark keeps its place in a list ordered by creation time. Duplicate URLs are allowed in this app.

### Describe the values shared by the page and forms

Create `lib/bookmark-types.ts`. `BookmarkInput` describes the editable fields. `BookmarkView` is the shape our components receive, with the identifier and dates converted to strings. `ActionState` carries the result of a submission, including any field errors and the values the user entered.

`lib/bookmark-types.ts`

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

An unused note becomes an empty string. Keeping that field present lets new bookmarks, saved bookmarks and rejected submissions use the same shape.

### Check the actual submitted values

TypeScript helps us while writing the app, but a request can contain values that never passed through our form. Before saving anything, we’ll check that the fields are text, trim whitespace, and enforce lengths. A URL must be an absolute HTTP or HTTPS address without embedded credentials.

Put the validator in `lib/bookmark-validation.ts`:

`lib/bookmark-validation.ts`

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

Notice the distinction between checking a URL and opening it. This code checks the address format. It does not fetch the page or establish that the destination is safe. The identifier check will be useful for edits and deletes, where we must validate an ID before constructing an `ObjectId`.

## Connect once and reuse the client

Saving a bookmark and reading the list both need MongoDB. They can share a client instead of creating one for every operation. Replace `lib/mongodb.ts` with this helper:

`lib/mongodb.ts`

```typescript
import "server-only";

import { MongoClient, type Db, type MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;

// Connection metadata so MongoDB can identify this app in monitoring and
// logs.
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

`getClient()` connects on first use. In development, the promise lives on `globalThis` so hot reloads can reuse it. In production, it lives in the module and can be reused within that running server instance. Each `MongoClient` manages its own [connection pools](https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/connection-pools/), so we leave the client open for later operations. A failed initial connection clears the cached promise, allowing another call to try again.

The five-second `serverSelectionTimeoutMS` bounds how long this app waits to select a database server. It does not time out the whole HTTP request. We leave pool sizes at the driver defaults here. A busier deployment needs measurements of its traffic and connections before tuning those limits.

`getDatabase()` selects `bookmark_app` from the URI. The `server-only` import catches accidental use of this module from a Client Component. It protects the code boundary, but it does not authenticate a visitor.

The starter’s connection-status module imports the old default export. Remove it now, along with the starter branding files we no longer need. We’ll replace the starter page before running the app again:

```bash
rm db/connection-status.ts app/favicon.ico app/fonts.js public/og.png \
  assets/logo.svg assets/logo-dark.svg \
  assets/vercel-logotype-dark.svg assets/vercel-logotype-light.svg
```

## Save and read the first bookmark

### Start with two database operations

Create `db/bookmarks.ts` below. `getCollection()` selects the collection, and `toBookmarkView()` converts MongoDB’s values into the strings our components use. The first version of `listBookmarks()` reads the newest 100 records. We’ll add a way to reach older records after the basic flow works.

`db/bookmarks.ts`

```typescript
import "server-only";

import { type WithId } from "mongodb";

import type { BookmarkInput, BookmarkView } from "@/lib/bookmark-types";
import { getDatabase } from "@/lib/mongodb";

const COLLECTION_NAME = "bookmarks";

// Show at most 100 bookmarks in the list.
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

export async function listBookmarks(): Promise<BookmarkView[]> {
  const collection = await getCollection();
  const documents = await collection
    .find({})
    .sort({ createdAt: -1, _id: -1 })
    .limit(BOOKMARK_LIST_LIMIT)
    .toArray();
  return documents.map(toBookmarkView);
}
```

[`find()` returns a cursor](https://www.mongodb.com/docs/drivers/node/current/crud/query/cursor/), which lets us configure the query before reading its results. Here, `sort()` puts newer bookmarks first, `limit()` bounds the result, and `toArray()` gives the page an array to render. `_id` breaks ties when two bookmarks have the same creation timestamp.

Now append `createBookmark()` to the same file:

`db/bookmarks.ts`

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

`insertOne()` saves the document and returns its generated identifier. We list each field explicitly, so extra request properties cannot become document fields. Both timestamps use the same `now` value because a new bookmark has not been edited yet.

### Let the form call the server

We have database functions, but the browser needs a way to reach them. A [Server Action](https://nextjs.org/docs/app/guides/forms) will receive the form submission, validate it, and call `createBookmark()`. Create `app/actions.ts` with the imports and feedback helpers first:

`app/actions.ts`

```typescript
"use server";

import { revalidatePath } from "next/cache";

import { createBookmark } from "@/db/bookmarks";
import { validateBookmark } from "@/lib/bookmark-validation";
import type {
  ActionState,
  BookmarkFieldErrors,
  BookmarkValues,
} from "@/lib/bookmark-types";

const UNCONFIRMED_WRITE_SUFFIX =
  "Refresh the page to check the result before trying again.";

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

The `"use server"` directive marks the exported actions as server functions. `readValues()` preserves text for the form to display again. The validator still receives the raw `FormData` values, so converting something for display cannot make it valid input.

Append the action that saves the bookmark:

`app/actions.ts`

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

There are three outcomes worth keeping separate. Invalid fields return specific errors without writing. A confirmed save returns empty values and calls [`revalidatePath("/")`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath), so the page can show the new record. A database error keeps what the user typed and asks them to refresh before retrying.

That last message is deliberate. A connection can fail after MongoDB has accepted a write, leaving the app unable to confirm the result. “Could not confirm” avoids telling someone the bookmark definitely failed and encouraging a duplicate submission.

The `_prevState` parameter is there because [`useActionState`](https://react.dev/reference/react/useActionState) passes the previous result before the new form data. This action does not need the previous result, but it must keep the parameter so `formData` receives the right argument.

### Build the add form

Now for the part we can use. Create `components/bookmark-form.tsx` with the imports, shared styles and submit button below:

`components/bookmark-form.tsx`

```typescript
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
```

`SubmitButton` sits inside the form, where `useFormStatus()` can read its pending state. It switches to “Saving…” and disables itself while the request is in progress. Append the form component:

`components/bookmark-form.tsx`

```typescript
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

`useActionState()` connects the action result to the form. On success, the effect clears the fields and returns to the newest page. Rejected submissions keep their values. The labels identify each input, and `aria-describedby` connects a field to its error message. We use `noValidate` so the app’s server validation provides consistent feedback.

### Show the saved bookmark

For this first checkpoint, the bookmark card only needs to display the saved data. Create `components/bookmark-item.tsx`:

`components/bookmark-item.tsx`

```typescript
import type { BookmarkView } from "@/lib/bookmark-types";

export function BookmarkItem({ bookmark }: { bookmark: BookmarkView }) {
  return (
    <li className="rounded-xl border border-[#1C2B26]/10 bg-white p-5 shadow-sm">
      <a href={bookmark.url} target="_blank" rel="noopener noreferrer"
        className="font-semibold text-[#00684A] underline underline-offset-4">
        {bookmark.title}
      </a>
      <p className="mt-1 break-all text-sm text-[#4B5F58]">{bookmark.url}</p>
      {bookmark.note ? <p className="mt-3 whitespace-pre-wrap text-sm">{bookmark.note}</p> : null}
    </li>
  );
}
```

The note is optional, so we render it only when there is something to show. Next, give the app its background, typography and focus styles:

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

Add a small bookmark icon for the browser tab:

`app/icon.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#00684A"/>
  <path d="M21 16h22v34L32 42 21 50Z" fill="#FAF7F0"/>
</svg>
```

Replace `app/page.tsx` with the page below. It is a [Server Component](https://nextjs.org/docs/app/getting-started/server-and-client-components), so it can read MongoDB before rendering the list:

`app/page.tsx`

```typescript
import { connection } from "next/server";

import { BookmarkForm } from "@/components/bookmark-form";
import { BookmarkItem } from "@/components/bookmark-item";
import { listBookmarks } from "@/db/bookmarks";
import type { BookmarkView } from "@/lib/bookmark-types";

// MongoDB is reached from Node.js server code only.
export const runtime = "nodejs";

// The page reads the database on every request; never connect during a
// static build.

export default async function Home() {
  // Marks the page dynamic and waits for a request connection, so the
  // database is only queried for real visitors, never at build time.
  await connection();

  let bookmarks: BookmarkView[] = [];
  let isDatabaseUnavailable = false;

  try {
    bookmarks = await listBookmarks();
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
                  No bookmarks yet
                </h2>
                <p className="mt-2 text-sm text-[#4B5F58]">
                  Add your first link with the form on this page.
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
          </section>
        </main>

      </div>
    </div>
  );
}
```

`await connection()` makes the database read happen for a request, rather than during the build. The page also distinguishes an empty collection from a failed read. “No bookmarks yet” is helpful when the list is empty, but misleading if the database could not be reached.

### Try the first save

```bash
nvm use
npm run dev -- --hostname 127.0.0.1
```

Open the app. Enter **MongoDB Node.js driver docs** as the title, `https://www.mongodb.com/docs/drivers/node/current/` as the URL, and **Check how insertOne returns the new document’s ID.** as the note. Click **Add bookmark**, then reload the page. The card should still be there.

Follow the bookmark through the code you just wrote:

**Save:** `BookmarkForm` → `createBookmarkAction` → `insertOne()`

**Read:** `Home` → `listBookmarks()` → `BookmarkItem`

The form sent `FormData` to the action, the action validated it and inserted a document, and the refreshed Server Component read that document back. Reloading matters here. It shows that the bookmark came from MongoDB rather than existing only in the form’s browser state.

Try submitting a second bookmark with an empty title or a URL such as `javascript:alert(1)`. You should see a field error, keep your entered values, and get no new card. Once those checks work, we can give the saved bookmark its Edit and Delete buttons.

## Edit a note and remove a bookmark

### Update and delete the MongoDB document

Suppose the documentation link was useful, but the note needs more detail. We need to update that one record without changing when it was created. In `db/bookmarks.ts`, replace the MongoDB import and add the ID validator import:

`db/bookmarks.ts`

```typescript
import { ObjectId, type WithId } from "mongodb";
import { isBookmarkId } from "@/lib/bookmark-validation";
```

Append these two functions to the file:

`db/bookmarks.ts`

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

`updateOne()` selects the document by `_id`. `$set` changes the editable fields and `updatedAt`, leaving `createdAt` alone. We check `matchedCount` because the useful question is whether the record still exists. If someone deleted it while another browser had the editor open, the action can explain that instead of reporting success.

`deleteOne()` also targets one `_id`. Its `deletedCount` tells us whether anything was removed. These operations do not merge concurrent edits. Another open browser needs a refresh to see changes, and the last successful edit can replace earlier field values.

### Add the edit and delete actions

In `app/actions.ts`, replace the two database and validation imports with these:

`app/actions.ts`

```typescript
import { createBookmark, deleteBookmark, updateBookmark } from "@/db/bookmarks";
import { isBookmarkId, validateBookmark } from "@/lib/bookmark-validation";
```

Add this value import alongside the existing type import. The delete action uses it as the starting state for its response:

`app/actions.ts`

```typescript
import { emptyActionState } from "@/lib/bookmark-types";
```

Add this message beside `UNCONFIRMED_WRITE_SUFFIX`:

`app/actions.ts`

```typescript
const RECORD_GONE_SUFFIX = "Refresh the page to see the current list.";
```

Append `updateBookmarkAction()`. It checks both the ID and the editable fields before calling the database:

`app/actions.ts`

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

A rejected edit keeps the editor open with the submitted values. A successful edit refreshes the list. Finish the file with the delete action:

`app/actions.ts`

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

The confirmation button will help prevent accidental clicks, but it cannot validate a request. That is why the delete action checks the ID again. Running on the server does not make an action private, either. Our hosted access restriction must cover action requests as well as page loads.

### Turn the card into an editor

We’ll replace `components/bookmark-item.tsx` in three pieces. Paste them in order into the same file. The first piece adds client state, shared styles, date formatting and the two pending-state buttons:

`components/bookmark-item.tsx`

```typescript
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
```

Next comes `EditBookmarkForm`. It starts with the saved values and includes the bookmark ID in a hidden field. Each input ID includes that bookmark ID too, so labels and errors remain associated with the right card when several bookmarks are on screen. Append this component:

`components/bookmark-item.tsx`

```typescript
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
```

The effect closes the editor after a successful save. **Cancel** exits without submitting. Neither a validation error nor an unconfirmed write closes the form and discards the user’s work.

Finally, append `BookmarkItem`. Its local state decides whether the card shows its content, the editor, or the delete confirmation:

`components/bookmark-item.tsx`

```typescript
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

The first Delete click only reveals the confirmation controls. The database action runs when **Confirm delete** is submitted. While deletion is pending, we disable the controls that could conflict with it.

### Try an edit, then change your mind about deleting

Return to the documentation bookmark and click **Edit**. Change the note to **Use insertedId when returning the saved bookmark to the form.** Save, then reload. The new note should remain, and the card should now show an Updated date.

![Editing the documentation bookmark’s note](images/bookmarks-edit-card.png)

*The edit form keeps the saved title and URL while you change the note.*

Click **Delete**, then **Cancel**. The card should stay. Click Delete again and choose **Confirm delete**. Reload once more to check the record is gone. We now have the full create, read, update and delete flow working through the browser.

## Make room for older bookmarks

The list currently stops at the newest 100 records. That keeps a request bounded, but it leaves older bookmarks out of reach. Let’s add an **Older bookmarks** link without changing how saving or editing works.

### Keep the order predictable

We sort by `createdAt` descending, then `_id` descending. Imagine three bookmarks with these values. The shortened IDs are labels for this example, not values to paste into MongoDB:

- **Driver docs** — 10:00, ID ending in `003`

- **Insert guide** — 10:00, ID ending in `002`

- **React forms** — 09:55, ID ending in `001`

If a page ends at Driver docs, the next page needs records created before 10:00, plus any records at 10:00 with a smaller ID. A timestamp-only filter would skip Insert guide even though we have not displayed it yet. The second field gives us a stable order through the tie.

Replace only `listBookmarks()` in `db/bookmarks.ts` with the following helper and function. Keep the imports, collection helpers, limit and three write operations:

`db/bookmarks.ts`

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

Here, “cursor” is used in two ways. The MongoDB driver’s cursor is the query object returned by `find()`. Our pagination token is a string containing the last displayed bookmark’s timestamp and ID. We put that token in the next page’s URL and validate it before building the filter.

The query reads up to 101 records. The first 100 become cards, and the extra record tells us whether to show an Older bookmarks link. Invalid pagination tokens fall back to the newest page. No records are deleted when they fall outside the current page.

### Create an index for that query

The query sorts and filters on `createdAt` and `_id`, so we’ll create a compound index with those fields in that order. Put the setup script in `scripts/setup-db.mjs`:

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

Run it against the database you’re using for the app:

```bash
nvm use
npm run db:setup
```

You should see **Bookmark index is ready.** The script closes its own client when it finishes. Index creation belongs in setup, so the app does not try to create indexes on every request. Repeat this step after restarting the temporary database, because its indexes disappear with its data.

### Connect the page links

`listBookmarks()` now returns page metadata alongside the records. Replace `app/page.tsx` with this version to read the `before` query parameter and render the navigation links:

`app/page.tsx`

```typescript
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

**Older bookmarks** carries the token forward. **Back to newest** drops it. After a new bookmark is saved, the add form’s existing `router.replace("/")` also returns to the newest page, where that record belongs. Editing keeps the original creation time, so an edit does not jump to the top.

With fewer than 101 records, there is no older page to show. The normal list should still work. Next, we’ll automate the interactions we have been checking by hand.

## Test the flow in a browser

A successful build cannot tell us whether clicking Save really persists an edit. We’ll use Playwright to add a bookmark through the form, reload, edit it, reload again, cancel a deletion, then confirm it. We’ll also check that an unavailable database preserves the text someone was trying to save.

The tests must not clear the database you have been using. The runner below starts a separate temporary MongoDB process on a random port, supplies its URI to the app and tests, and stops it afterwards. It also checks a production build with no database URI, which catches accidental database access during the build.

```bash
npm pkg set scripts.typecheck="tsc --noEmit" \
  scripts.verify="node scripts/verify.mjs" \
  scripts.verify:dev="node scripts/verify.mjs --dev" \
  scripts.test="npm run verify"
rm tests/e2e/home.spec.ts
```

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

`verify` uses a production build and server. `verify:dev` uses the development server. Both select their own temporary database and localhost port. Add this Playwright configuration:

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

Replace the template tests with `tests/e2e/bookmarks.spec.ts`. The first part defines the disposable-database helpers and selects the healthy or unavailable-database scenario:

`tests/e2e/bookmarks.spec.ts`

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
```

Append the browser scenarios. The successful flow checks the visible card and the stored record, including the timestamps. Reloads make persistence part of the test rather than an assumption:

`tests/e2e/bookmarks.spec.ts`

```typescript
test.describe("healthy database", () => {
  test.skip(!healthy, "Only run against the healthy disposable database.");

  test("a bookmark survives reloads, edits, and a cancelled delete", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "No bookmarks yet" })).toBeVisible();
    await add(page, "The tab from Tuesday", "https://example.com/tuesday", "Read before Friday");
    await expect(item(page, "The tab from Tuesday")).toBeVisible();
    await page.reload();
    const original = item(page, "The tab from Tuesday");
    await expect(original).toContainText("Read before Friday");
    const saved = await bookmarks.findOne({ title: "The tab from Tuesday" });
    expect(saved?.url).toBe("https://example.com/tuesday");
    expect(saved?.createdAt).toBeInstanceOf(Date);
    expect(saved?.updatedAt).toEqual(saved?.createdAt);

    await original.getByRole("button", { name: "Edit", exact: true }).click();
    const edit = page.locator('form').filter({ has: page.locator('input[name="id"]') });
    await edit.getByLabel("Title", { exact: true }).fill("Read it on Friday");
    await edit.getByLabel("URL", { exact: true }).fill("https://example.com/friday");
    await edit.getByLabel(/Note/).fill("Keep this for next time");
    await edit.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(item(page, "Read it on Friday")).toBeVisible();
    await page.reload();
    const updated = item(page, "Read it on Friday");
    await expect(updated).toContainText("Keep this for next time");
    await expect(updated.getByRole("link", { name: "Read it on Friday" })).toHaveAttribute("href", "https://example.com/friday");
    const edited = await bookmarks.findOne({ _id: saved!._id });
    expect(edited?.createdAt).toEqual(saved?.createdAt);
    expect(edited?.updatedAt.getTime()).toBeGreaterThan(saved!.updatedAt.getTime());

    await updated.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(updated.getByText("Delete this bookmark?", { exact: true })).toBeVisible();
    await updated.getByRole("button", { name: "Cancel", exact: true }).click();
    expect(await bookmarks.countDocuments()).toBe(1);
    await expect(updated.getByText("Delete this bookmark?", { exact: true })).toHaveCount(0);
    await updated.getByRole("button", { name: "Delete", exact: true }).click();
    await updated.getByRole("button", { name: "Confirm delete", exact: true }).click();
    await expect(page.getByRole("heading", { name: "No bookmarks yet" })).toBeVisible();
    expect(await bookmarks.countDocuments()).toBe(0);
    await page.reload();
    await expect(page.getByRole("heading", { name: "No bookmarks yet" })).toBeVisible();
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

Install Playwright’s Chromium browser and its operating-system dependencies, then run both checks from the project root. You only need to repeat the browser installation when Playwright changes or you move to a new environment:

```bash
nvm use
npx playwright install --with-deps chromium
npm run verify
npm run verify:dev
```

If a test fails, read the named assertion and open the Playwright report before changing the app. These checks exercise the local app and its disposable database. They do not test Atlas networking or the access controls on a hosted deployment. We’ll check those separately after deployment.

## Save your project and run the checks on GitHub

[Create an empty repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository) in your GitHub account. Leave its README, licence and `.gitignore` options unchecked because the project already has those files. Copy the repository’s HTTPS URL.

Before pushing, replace `.github/workflows/ci.yml` with this workflow. It runs the same isolated production verification on pushes to `bookmarks` or `main`, and on pull requests. It needs no Atlas secret:

`.github/workflows/ci.yml` (YAML)

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
        uses: actions/checkout@v7.0.0

      - name: Setup Node.js
        uses: actions/setup-node@v6.4.0
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
        uses: actions/upload-artifact@v7.0.1
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
          if-no-files-found: ignore
```

A release tag can later point to a different commit. To keep the action code fixed, [pin it to a full commit SHA](https://docs.github.com/en/actions/reference/security/secure-use#using-third-party-actions) instead.

Remove the template’s `CODEOWNERS` file, which names its upstream maintainers. Rename the template remote to `upstream`, then add your own repository as `origin`. Replace the example URL below with the URL you copied. Check `git status` before committing to confirm that `.env` is excluded:

```bash
rm .github/CODEOWNERS
git remote rename origin upstream
git remote add origin https://github.com/YOUR_USERNAME/bookmarks-build.git
git status
git add .
git commit -m "Build the bookmarks app"
git push -u origin bookmarks
```

Now open the repository’s **Actions** tab and check the run. If a browser test fails, the workflow uploads a Playwright report. Keep the run green before deploying, so a setup mistake does not become a second problem to diagnose on Vercel.

## Deploy the app to Vercel

Import your new repository into Vercel and select the `bookmarks` branch as the production branch. This deploys the application you built. The starter template’s deploy button would create another copy of the starter.

### Restrict access before adding the database

Our app has no application login, so the hosting platform must protect the list. Before adding working database credentials, go to **Project → Settings → [Deployment Protection](https://vercel.com/docs/deployment-protection)** and select **All Deployments**. Check for protection exceptions and share-link bypasses too. Standard Protection leaves production domains public.

### Connect Vercel to Atlas

In the project’s **Environment Variables**, add a Secret named `MONGODB_URI` with the Atlas URI and select **Production**. The temporary database on your computer or Codespace cannot serve the deployed app. Add a separate Preview value only if you use preview deployments, preferably pointing to a separate database so preview changes cannot alter the production list.

Atlas must also allow Vercel’s outbound connections. Vercel uses dynamic outbound IPs by default, so follow its [allowlisting guidance](https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address) for your networking option. The IP behind your app’s public domain is not the outbound address used to reach Atlas.

If you deliberately use Atlas’s `0.0.0.0/0` entry for this setup, it allows connection attempts from anywhere. Use strong database credentials limited to `bookmark_app`. Vercel’s access gate protects HTTP requests to the app, while Atlas credentials and network rules protect direct database connections.

Prepare the Atlas index from a trusted terminal in the project directory. Set `MONGODB_URI` to that database in the terminal environment or your local `.env`, allow the terminal host’s outbound IP in Atlas, and run:

```bash
nvm use
npm run db:setup
```

Wait for **Bookmark index is ready**, then deploy. Repeat the index setup for each separate Preview database. If you changed your local `.env`, restore the URI you want for local development before restarting Next.js. [Environment-variable changes](https://vercel.com/docs/environment-variables) apply to new deployments, so redeploy after changing a Vercel value.

### Check the hosted app

Open the production domain, generated deployment URL and any preview URL in a signed-out browser. Each must require authentication before showing the app. Then sign in as an allowed visitor and repeat the create, reload, edit, cancel-delete and confirm-delete flow with a public sample link.

Also verify that the access gate blocks a valid Server Action request without authentication. A protected-looking page alone does not prove that writes are protected. Capture a test submission in your browser’s Network panel and confirm that it succeeds while you are authenticated. Replay the same request body and action binding against the same deployment URL, removing cookies, Authorization credentials and any protection-bypass credentials. The platform should reject it or require sign-in, and the bookmark list should remain unchanged. An invalid request failing validation would not prove protection. If the unauthenticated request changes data, take the deployment offline until you have corrected the protection settings and this check passes.

## Give that tab a home

You now have somewhere to save the documentation link and the reason you wanted it. The form passes real input through a Server Action, MongoDB stores the document, and the Server Component reads it back. Editing and deletion use the same path, with browser tests checking that the changes survive a reload.

For a next step, add tags to group links by project. Start with one question: what should happen when someone saves a bookmark without a tag? Work that choice through the input type, validation, document and form, then add a browser test. It’s the same path we followed for the note field, applied to a feature you choose.
