# Tutorial editorial outline — 30 October 2026

The current [tutorial](tutorial.md) is a self-contained build from MongoDB’s public Next.js template. The companion repository remains private. Its source is an optional reference and is not linked from the reader-facing article.

## Opening and audience

The user selected the reader scenario “That documentation tab has been open since Tuesday.” It is not presented as a personal anecdote. The article assumes React components, props, forms and basic TypeScript, then introduces Next.js and MongoDB concepts when they become useful.

Use warm, direct language, varied transitions and concrete outcomes. Follow the teaching qualities of the approved Edidiong Asikpo references, especially the movie tracker, while using original wording. Avoid review notes in the article, invented experiences, “demo” branding and prose semicolons.

## Runnable stages

1. Choose local development or Codespaces independently from Atlas or temporary MongoDB. Select the tested public-template commit, install the tested versions, and confirm “Database connected.”
2. Save and read a first bookmark. Introduce its document, input validation, client reuse, bounded newest-100 query, create action, form and display-only card. Reload and try invalid input.
3. Edit and delete that same bookmark. Explain exact ID targeting, fixed update fields, preserved creation time, stale records, retained input and explicit confirmation. Test reloads and cancelling deletion.
4. Reach older bookmarks. Put pagination and its compound index together, using a worked equal-timestamp tie. Replace only the relevant query and page.
5. Automate a real UI create/edit/delete persistence flow and unavailable-database cases in an isolated temporary database.
6. Create the reader’s GitHub repository, install the CI workflow, push, inspect its result, then deploy the built app to Vercel with All Deployments protection.
7. Check authenticated CRUD and a valid unauthenticated action request. End with a focused tags extension that reuses the input-to-document path.

## Scope and presentation

One list, no application sign-in or per-user ownership. Hosted access restrictions must cover pages and writes. Do not imply live synchronization or merged concurrent edits. URLs are validated for format without visiting their destinations.

Keep all required files and commands in assembly order. Split long files into clear append sections, avoid duplicate “excerpt plus full file” presentations, and state precisely what is replaced. Preserve native Google Docs code blocks, language labels, syntax colors, filename/inline-code styles, the high-resolution hero and a relevant UI close-up.

## Verification and publication

See [verification.md](verification.md) for executed checkpoints, the exact article reconstruction, Codespaces, hosted CI and Doc readback/render checks. Dated Atlas/Vercel evidence is separate from new local and Codespaces tests. Publication still needs the publisher’s technical/editorial review and the owner’s final review. Do not make the companion public or contact reviewers without instruction.
