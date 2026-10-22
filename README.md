# jeunonsensemble.be

Site web de Jeûnons Ensemble. Content lives in Contentful; the site is a TanStack Start app rendered on Cloudflare Workers.

## Setup

```bash
pnpm install
cp .dev.vars.example .dev.vars # then fill in the Contentful delivery token
pnpm dev                       # http://localhost:3000
```

## Scripts

| Script            | What it does                                                          |
| ----------------- | --------------------------------------------------------------------- |
| `pnpm dev`        | Dev server running in workerd                                         |
| `pnpm build`      | Production build into `dist/`                                         |
| `pnpm preview`    | Build, then serve the production bundle locally                       |
| `pnpm check`      | oxfmt check, oxlint, and `tsc`                                        |
| `pnpm format`     | Format with oxfmt                                                     |
| `pnpm deploy`     | Build and `wrangler deploy`                                           |
| `pnpm cf-typegen` | Regenerate `worker-configuration.d.ts` after editing `wrangler.jsonc` |

## Content

Every request reads the `master` entry from Contentful (cached at the edge for 60 seconds), so edits show up within a minute without a rebuild. The first page of the entry is served at `/`, the others at `/<slug>`.

## Deploy

The Contentful delivery token is a Worker secret:

```bash
pnpm exec wrangler secret put CONTENTFUL_ACCESS_TOKEN
pnpm deploy
```
