import type { Document } from "@contentful/rich-text-types";
import { z } from "zod";

import { assetUrl } from "./asset-url";

const link = z.object({
  sys: z.object({ type: z.literal("Link"), linkType: z.string(), id: z.string() }),
});

const includes = z.object({
  Entry: z.array(z.object({ sys: z.object({ id: z.string() }) }).loose()).default([]),
  Asset: z.array(z.object({ sys: z.object({ id: z.string() }) }).loose()).default([]),
});

const entriesResponse = z.object({
  items: z.array(z.unknown()),
  includes: includes.default({ Entry: [], Asset: [] }),
});

const imageSchema = z
  .object({
    fields: z.object({
      title: z.string().default(""),
      file: z.object({ url: z.string() }),
    }),
  })
  .transform(({ fields }) => ({
    title: fields.title,
    url: assetUrl(fields.file.url),
  }));

const section = z
  .object({
    fields: z.object({
      slug: z.string(),
      title: z.string(),
      content: z.custom<Document>(
        (value) => z.object({ nodeType: z.literal("document") }).safeParse(value).success,
      ),
    }),
  })
  .transform(({ fields }) => fields);

const page = z
  .object({
    fields: z.object({
      slug: z.string(),
      title: z.string(),
      banner: imageSchema.optional(),
      sections: z.array(section).default([]),
    }),
  })
  .transform(({ fields }) => fields);

const site = z
  .object({
    fields: z.object({
      websiteName: z.string(),
      description: z.string().default(""),
      copyright: z.string().default(""),
      email: z.string().default(""),
      shareImage: imageSchema.optional(),
      pages: z.array(page).min(1),
    }),
  })
  .transform(({ fields }) => ({
    name: fields.websiteName,
    description: fields.description,
    copyright: fields.copyright,
    email: fields.email,
    shareImage: fields.shareImage,
    pages: fields.pages.map((p, index) => ({ ...p, isHome: index === 0 })),
  }));

export type Image = z.output<typeof imageSchema>;
export type Section = z.output<typeof section>;
export type Page = Site["pages"][number];
export type Site = z.output<typeof site>;

// Contentful returns linked entries and assets once, in `includes`. Inline them
// so the schemas above can describe the tree the site actually renders.
function resolveLinks(value: unknown, byId: Map<string, unknown>, seen: Set<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => resolveLinks(item, byId, seen)).filter((item) => item !== undefined);
  }
  if (value === null || typeof value !== "object") return value;

  const asLink = link.safeParse(value);
  if (asLink.success) {
    const { id } = asLink.data.sys;
    const target = byId.get(id);
    if (target === undefined || seen.has(id)) return undefined;
    return resolveLinks(target, byId, new Set(seen).add(id));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, resolveLinks(child, byId, seen)]),
  );
}

export async function fetchSite(spaceId: string, accessToken: string): Promise<Site> {
  const url = new URL(`https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries`);
  url.searchParams.set("content_type", "master");
  url.searchParams.set("include", "2");

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    throw new Error(`Contentful responded ${response.status} ${response.statusText}`);
  }

  const body = entriesResponse.parse(await response.json());
  const byId = new Map<string, unknown>(
    [...body.includes.Entry, ...body.includes.Asset].map((item) => [item.sys.id, item]),
  );
  return site.parse(resolveLinks(body.items[0], byId, new Set()));
}
