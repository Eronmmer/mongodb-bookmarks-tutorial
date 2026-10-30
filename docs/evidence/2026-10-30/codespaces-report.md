# Codespaces verification — 30 October 2026

## Result

PASS. Reconstructed the final rewritten tutorial in a new Codespace from the PUBLIC `mongodb-developer/nextjs-template-mongodb` repository. The private companion was not cloned. Applied the frozen A→B→C→D article payloads plus tutorial-tests. All 22 final files matched their SHA256 checksums. This remote pass verifies the cumulative final app. The checkpoint agent verified intermediate stages locally.

Owned Codespace: `terrible-gravestone-xv4vx9gr54h6467`, 2-core, Europe West. The existing $0 paid-usage budget was not changed. GitHub showed included discounts covering usage at setup. No Atlas credentials were used. GitHub API confirmed the companion repository remained PRIVATE afterward.

The owned Codespace was STOPPED at completion. GitHub displayed: `Codespace "terrible gravestone" stopped.` The older `weary-corpse-pg9qw4vr5qvh7757` Codespace was untouched. All three dedicated browser tabs were closed. No native Chrome controls or user tabs were used.

## Reader route actually tested

1. GitHub Codespaces → New: select the public template, main, 2-core, Europe West. The repository's Code → Codespaces route was not the literal click path used.
2. The prebuild opened at `a5b00b1ba12529e3a84406c6d9f209e0388d69bb`, despite API main being the pinned revision. Runtime was Ubuntu 20.04, Node 22.15.0, npm 9.8.1. Explicitly fetch and switch:

```bash
git fetch origin
git switch -c bookmarks 09278fa9369ce03c3e988156351655f87317ecf6
```

3. Replace `.devcontainer/devcontainer.json` with the exact A-stage configuration:

```json
{
  "name": "mongodb-bookmarks-tutorial",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:24-bookworm",
  "postCreateCommand": "npm ci",
  "forwardPorts": [3000],
  "portsAttributes": {
    "3000": {
      "label": "Bookmarks",
      "onAutoForward": "notify"
    }
  }
}
```

4. Run **Codespaces: Rebuild Container** and wait for the post-create command. The UI command appeared delayed twice. Its old extension logged a PendingMigrationError. Issued this supported fallback inside the remote terminal:

```bash
gh codespace rebuild --codespace "$CODESPACE_NAME"
```

The connection reloaded, image rebuilt, and `npm ci` completed. It is unclear whether the delayed UI action or CLI call triggered the rebuild. No new OAuth scope was granted.

5. Rebuilt runtime was Debian 12 Bookworm, Node 24.22.1, npm 11.19.1. Ran exact dependency commands from `selfcontained-acceptance-install.sh`, omitting only its macOS-specific nvm source line. Codespaces already provides nvm. `nvm install` and `nvm use` worked.
6. Applied stage payloads and verified their checksums. Installed Playwright Chromium and its Linux dependencies, then ran both verification commands.
7. Copied `.env.example` to `.env`. Ran the actual `npm run db:local` helper and `npm run db:setup`. MongoDB 8.2.6 ran on `127.0.0.1:27028` with database `bookmark_app`.
8. Started exactly:

```bash
npm run dev -- --hostname 127.0.0.1
```

9. The Ports panel showed port 3000, a running Next.js 16.4.3 process, and **Private** visibility. Used its actual URL for authenticated browser checks:
`https://terrible-gravestone-xv4vx9gr54h6467-3000.app.github.dev/`.

**Article correction:** The JSON forwards port 3000. It does not explicitly set visibility. Tell readers separately to confirm **Private** in Ports.

## Checks that passed

- Container rebuild and post-create `npm ci`.
- Article dependency setup. Initial template lockfile reported 20 vulnerabilities. After the specified upgrades and `npm update`, npm reported zero vulnerabilities at test time. It also warned that ESLint 9.39.5 is deprecated and displayed npm 11 install-script notices. No audit-fix command was used.
- SHA256 match for all 22 reconstructed final files.
- `npm run verify`: lint, TypeScript, production build, then healthy/missing/unreachable runtime checks. Each scenario had one passing test, with other scenario-specific tests intentionally skipped. Durations: 5.0s, 1.7s, 11.9s.
- `npm run verify:dev`: the same three scenarios passed, durations 4.2s, 2.3s, 12.9s.
- Tutorial's real `db:local` helper and `db:setup` index creation.
- Authenticated browser through the actual private URL: create → reload → edit → reload → confirm delete → reload. Every step passed. Database count afterward: zero.
- Anonymous GET from the Mac: 302.
- A valid serialized create Server Action sent anonymously to the private URL: 401, entire bookmark snapshot unchanged.
- The same serialized body sent directly to the owned app with the expected `localhost:3000` Origin and forwarded host: 200 and one created fixture. Cleanup deleted that fixture. This positive control proves the anonymous request contained valid action data.
- The same valid body with `untrusted.example` or `localhost:3001` Origin: 500 Invalid Server Actions request, database unchanged.
- Configuration matrix: `localhost:3000` allowance exists only with development + CODESPACES=true. It is absent for both production cases and development outside Codespaces.

Successful action body's SHA256: `7ba31ae805f403d96fd9c2d84754482596d5420f6f0895540e4abf7fef20a2a7`.

## Limits and observations

This run verifies Codespaces' authentication boundary. It does not repeat Vercel's previously recorded production gate, Atlas setup, or deployment. No Windows runtime was tested. No app authentication or per-user ownership was added.

No `allowedDevOrigins` addition was needed with Next.js 16.4.3. Existing conditional `serverActions.allowedOrigins` worked with the actual forwarded browser requests.

One development hydration warning was traced to Grammarly injecting `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed` into the body. The warning's HTML diff showed those attributes. User extensions were left untouched. Deliberate negative-origin tests also produced expected development error logs. Standalone Node imports for the configuration matrix warned about the package's missing module type. Normal Next build and tests passed, so no module-type change was made.

The first authentication harness assumed POST would return 302, but observed 401. Corrected that assertion and reran the complete proof successfully. Do not conflate GET 302 and POST 401.

## Evidence

All files are in this report's directory:

- `final-runtime-evidence.txt` and `.png`: action results, runtime checks, empty database and config matrix.
- `private-ports.png`: actual private forwarding.
- `private-browser-created.png`, `private-browser-edited.png`, `private-browser-cleaned.png`: browser CRUD.
- `codespace-stopped.txt` and `.png`: stopped-compute confirmation.
- `origin-and-auth-check.mjs`: sanitized test harness.
- `payload-manifest.json`, `check-payload.sh`: integrity verification.
- `apply-cumulative.sh`: compressed stage-payload transport, not article content.
- `route-observations.md`: initial working notes.
