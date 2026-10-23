# jeunonsensemble.be

Site web de Jeûnons Ensemble. Content lives in Contentful; the site is a TanStack Start app, prerendered to static files and served by Cloudflare Workers Static Assets.

## Setup

```bash
pnpm install
cp .env.example .env # then fill in the Contentful delivery token
pnpm dev             # http://localhost:3000
```

## Scripts

| Script                | What it does                                                         |
| --------------------- | -------------------------------------------------------------------- |
| `pnpm dev`            | Dev server, fetching content from Contentful on each request         |
| `pnpm build`          | Prerender every page into `dist/client`                              |
| `pnpm preview`        | Build, then serve `dist/client` with Wrangler, as in production      |
| `pnpm check`          | oxfmt check, oxlint, and `tsc`                                       |
| `pnpm format`         | Format with oxfmt                                                    |
| `pnpm deploy`         | Build and `wrangler deploy`                                          |
| `pnpm deploy:preview` | Build and create a Worker Preview named after the current git branch |

## Content

Content is a build input. `vite build` prerenders `/`, follows its links, and writes every page as static HTML, along with `404.html` and `sitemap.xml`. Contentful is called once per page during the build and never when serving, so the site stays well inside the Contentful Free plan's monthly API call limit. Client-side navigation reuses the content embedded in the first page, and `getSite` falls back to a static JSON file saved at build time instead of calling a server.

The first page of the entry is served at `/`, the others at `/<slug>`. Unknown URLs get `404.html` with a 404 status.

## Deploy

Workers Builds deploys `master` to production and every other branch to a Worker Preview. The Contentful delivery token is only needed at build time:

- Workers Builds: add `CONTENTFUL_ACCESS_TOKEN` under Settings › Builds › Variables and secrets.
- Locally: put it in `.env`, then `pnpm deploy` or `pnpm deploy:preview`.

Publishing in Contentful rebuilds the site. A Contentful webhook (Settings › Webhooks, on Entry and Asset publish/unpublish) POSTs to a Workers Builds deploy hook for `master` (Settings › Builds › Deploy Hooks). Treat the hook URL as a secret: anyone who has it can trigger builds.
