# jeunonsensemble.be

Jeûnons Ensemble uses TanStack Start, React, and Tailwind. Contentful is a build input. Cloudflare Workers Static Assets serves the prerendered site without a runtime server or CMS request.

## Run locally

Use Node 22 and pnpm.

```bash
pnpm install
cp .env.example .env
# Fill in CONTENTFUL_ACCESS_TOKEN without sharing or logging it.
pnpm dev
```

The dev server runs at http://localhost:3000. The default source is Contentful and requires the delivery token. Missing credentials fail the build. There is no fallback to demonstration content.

For local demonstration content without credentials:

```bash
pnpm preview:fixture
```

This explicitly selects `CONTENT_SOURCE=fixture`, builds the synthetic Delivery response in `tests/fixtures/contentful.json`, and serves it at http://localhost:4173 through Wrangler. HTML has a `content-source=fixture` meta tag and `noindex`. Both client and server artifacts go to `dist-fixture`, leaving `dist/client` intact. The fixture Wrangler config is for local serving only.

## Verify changes

```bash
pnpm check
pnpm test
pnpm build:fixture
pnpm verify:fixture
pnpm exec playwright install chromium
pnpm test:browser
```

`check` runs formatting, lint, and TypeScript checks. Unit tests cover parsing, metadata, image URLs, rich text, and deployment source guards. The output verifier reads actual HTML and sitemap routes, checks unique titles, descriptions, canonical and Open Graph tags, and verifies 404, manifest, robots discovery, and static function payloads.

Browser tests serve the fixture through Wrangler and cover focus containment, Escape, scroll restoration, menu navigation and resize, short-screen scrolling, skip links, overflow, computed contrast, banner layout, metadata, and actual HTTP 404 status. CI runs these checks without credentials. CI installs Chromium with OS dependencies.

For real Contentful output:

```bash
pnpm build
pnpm verify
pnpm preview
```

`build` runs `pnpm check` before Vite and writes `dist/client` and `dist/server`. `preview` rebuilds and serves production assets through Wrangler. A generic SPA preview server cannot verify the production 404 behavior. `format` applies the formatter.

## Content flow

`get-site.ts` chooses the source at build time. `fetchSite` requests Contentful links at depth 3. Pure `parseSite(raw)` resolves links, validates the content, and returns `Site`. Missing and cyclic links are omitted. `parseSiteWithDiagnostics(raw)` also returns their IDs without logging. `fetchSite` emits deduplicated warnings with the reference type and ID. Shared entries resolve at each placement. Rich-text entry links use page routes or section hashes, preferring the current page for shared sections. Malformed required fields fail parsing. Images retain optional native dimensions, and pages accept an optional CMS `description`.

The first CMS page is `/`; other pages use `/<slug>`. The build starts at `/`, follows links, and writes every content page, `404.html`, and `sitemap.xml`. Static function middleware embeds the public site data in pages and writes JSON for client navigation. Treat that JSON as public. Contentful is never called when serving the static build.

Event dates, registration text, and French editorial copy stay in Contentful. Repository code does not expire, replace, or fabricate event content. Page descriptions prefer the CMS override and otherwise use the first substantial paragraph, skipping quotations and attribution. The canonical origin is `https://jeunonsensemble.be`.

See [DESIGN.md](DESIGN.md) for visual rules and [AGENTS.md](AGENTS.md) for source ownership.

## Deploy

```bash
pnpm deploy
pnpm deploy:preview
```

Both entry points reject fixture mode before building, run the checked live build, verify the output, then invoke Wrangler. `deploy:preview` forces `SITE_NOINDEX=1` and verifies with `--preview`. `deploy` rejects `SITE_NOINDEX=1`, including values from `.env`. Normal `pnpm verify` rejects content pages with `noindex`. The production config always points at `dist/client`. `wrangler deploy` used directly bypasses these script checks.

Workers Builds can keep `pnpm build` as its build command because the check gate is part of that command. Use `pnpm build && pnpm verify` to add artifact verification to the build command. Configure `CONTENTFUL_ACCESS_TOKEN` as a build secret. Keep `CONTENT_SOURCE` unset or set to `contentful`. For previews through Workers Builds, explicitly set `SITE_NOINDEX=1` and use `pnpm build && pnpm run verify --preview`. Branch identity is not inferred from dashboard-specific variables. Keep `SITE_NOINDEX` unset for production builds.

Workers Builds deploys `master` to production and other branches to Worker Previews. Publishing in Contentful can trigger a rebuild through a webhook to the Workers Builds deploy hook. Treat the hook URL as a secret. Review the French content and the live browser result before deployment.
