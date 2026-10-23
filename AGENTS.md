# Working in this repository

Read [README.md](README.md) before build, content, or deployment changes.
Read [DESIGN.md](DESIGN.md) before changing a visible component or CSS.

## Source and content

- Contentful Delivery data enters through `src/content/get-site.ts`.
- `src/content/site.ts` parses unknown payloads into `Site` without side effects.
- The first CMS page owns `/`. Other pages use their CMS slug.
- CMS copy is French. Event dates and editorial changes stay in Contentful.
- `PageView` and `RichText` render the parsed content.
- `page-head.ts` owns page metadata and the shared canonical origin.
- `src/styles.css` owns shared palette and reading styles.
- TanStack generates `src/routeTree.gen.ts`. Change route source files instead.

## Build and checks

- Use pnpm, including `pnpm exec` for tools. Keep `pnpm-lock.yaml` current.
- Run `pnpm check` and `pnpm test` after source changes.
- Run the fixture build, output verifier, and browser tests for visible changes.
- `pnpm build` runs `pnpm check` before the live production build.
- Keep serving static only. Prerender HTML, sitemap, 404, and function JSON.
- Production Wrangler serves `dist/client`, without a runtime CMS or server.
- Fixture builds are explicit and isolated under `dist-fixture`.
- Deployment entry points require Contentful output and verify it before Wrangler.

## Credentials

Keep delivery tokens in ignored `.env` or build secrets. Never print them.
Only public CMS content belongs in generated HTML and static function payloads.
Keep recovered API responses and private working instructions outside the repo.
