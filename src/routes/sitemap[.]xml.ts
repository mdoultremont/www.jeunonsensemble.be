import { createFileRoute } from "@tanstack/react-router";

import { pagePath, SITE_ORIGIN } from "../content/page-head";

import { getSite } from "../content/get-site";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const site = await getSite();
        const urls = site.pages
          .map(
            (page) =>
              `  <url><loc>${`${SITE_ORIGIN}${pagePath(page)}`.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</loc></url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
