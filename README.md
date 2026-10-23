# jeunonsensemble.be

Site web de Jeûnons Ensemble. Content lives in Contentful; the site is a TanStack Start app rendered on Cloudflare Workers.

## Setup

```bash
pnpm install
cp .env.example .env # then fill in the Contentful delivery token
pnpm dev             # http://localhost:3000
```

## Scripts

| Script                | What it does                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `pnpm dev`            | Dev server running in workerd                                         |
| `pnpm build`          | Production build into `dist/`                                         |
| `pnpm preview`        | Build, then serve the production bundle locally                       |
| `pnpm check`          | oxfmt check, oxlint, and `tsc`                                        |
| `pnpm format`         | Format with oxfmt                                                     |
| `pnpm deploy`         | Build and `wrangler deploy`                                           |
| `pnpm deploy:preview` | Build and create a Worker Preview named after the current git branch  |
| `pnpm cf-typegen`     | Regenerate `worker-configuration.d.ts` after editing `wrangler.jsonc` |

## Content

Content is a build input. `vite build` (and `pnpm dev` at startup) fetches the `master` entry from Contentful once and bakes it into the Worker (`src/content/site-snapshot.ts`), so serving pages never calls Contentful. This keeps the site well inside the Contentful Free plan's monthly API call limit.

The first page of the entry is served at `/`, the others at `/<slug>`. In `pnpm dev`, restart the server to pick up new content.

## Deploy

Workers Builds deploys `master` to production and every other branch to a Worker Preview. The Contentful delivery token is only needed at build time:

- Workers Builds: add `CONTENTFUL_ACCESS_TOKEN` under Settings › Builds › Variables and secrets.
- Locally: put it in `.env`, then `pnpm deploy` or `pnpm deploy:preview`.

Publishing in Contentful rebuilds the site. A Contentful webhook (Settings › Webhooks, on Entry and Asset publish/unpublish) POSTs to a Workers Builds deploy hook for `master` (Settings › Builds › Deploy Hooks). Treat the hook URL as a secret: anyone who has it can trigger builds.
