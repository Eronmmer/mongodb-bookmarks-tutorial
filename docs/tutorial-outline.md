# Tutorial editorial outline — 30 October 2026

The current [tutorial](tutorial.md) starts from MongoDB’s public Next.js template. Following the user's 30 October decision, it teaches the core build and links to complete supporting files in the companion repository. The repository remains private during review and must become public before publication. The article and linked files together provide the build.

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

Keep required files and commands in assembly order. Explain MongoDB CRUD, connection reuse, server validation, Server Actions and the form-to-database flow in the article. Link long UI, styling, configuration and test-support files at immutable tested commits, naming their local destination and whether they replace an existing file. Clearly label excerpts. The first-save page uses its own tested checkpoint commit so it does not import pagination prematurely. Preserve native Google Docs code blocks, language labels, syntax colors, filename/inline-code styles, the high-resolution hero and the edit close-up.

## Verification and publication

See [verification.md](verification.md) for executed checkpoints, article reconstruction, Codespaces, hosted CI and Doc readback/render checks. Reconstruct the shortened route using both its inline operations and exact linked files. Dated cloud evidence is separate from new local tests. Publication still needs public companion access, the publisher’s technical/editorial review and the owner’s final review. The owner's plan to publish the repository later is not an instruction to change visibility during this edit. Do not contact reviewers without instruction.
