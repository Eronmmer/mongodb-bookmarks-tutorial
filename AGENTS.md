# AGENTS.md

## Build and Test Commands

Use these commands from the repository root:

```bash
npm install
npm run build
npm run lint
npm run test:e2e
npm run dev
```

`npm run test:e2e` runs the Playwright end-to-end suite. It requires a MongoDB instance
reachable via `MONGODB_URI` and the Playwright browsers installed
(`npx playwright install --with-deps chromium`). Playwright starts the app automatically
(`next dev` locally, `next start` in CI) via the `webServer` config in
[playwright.config.ts](./playwright.config.ts).

## Project Structure

- `app/`: Next.js App Router pages, layout, and global styles
- `app/page.tsx`: home page server component that renders the MongoDB connection badge
- `db/connection-status.ts`: server-side data access (MongoDB `ping` health check)
- `lib/mongodb.ts`: MongoDB client singleton (sets the `appName` connection metadata)
- `lib/utils.ts`: shared UI helpers (`cn` class merger)
- `components/ui/`: shadcn/ui components
- `tests/e2e/`: Playwright end-to-end tests
- `README.md`: setup and architecture guide
- `EDD.md`: MongoDB entity/document schema contract

## Environment Variables and Configuration

Required:

- `MONGODB_URI`: MongoDB connection string used by the app and the end-to-end tests

Configuration files:

- `.env.example`: example environment values
- `.env`: local environment values (create from the example with `cp .env.example .env`)

## MongoDB Skills

Use the official MongoDB agent skills from https://github.com/mongodb/agent-skills
whenever the task is MongoDB-specific and a matching skill exists.

## When To Use EDD.md

Use [EDD.md](./EDD.md) as the source of truth for the MongoDB data model in this repository.

Consult [EDD.md](./EDD.md) before making changes that touch:

- MongoDB collections, document structure, or field names
- Server code or route handlers that read or write database records
- Validation, form fields, API payloads, or UI that depend on persisted data
- Schema documentation, Mermaid diagrams, or entity modeling discussions

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
