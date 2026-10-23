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
      file: z.object({
        url: z.string(),
        details: z
          .object({
            image: z
              .object({ width: z.number().positive(), height: z.number().positive() })
              .optional(),
          })
          .optional(),
      }),
    }),
  })
  .transform(({ fields }) => ({
    title: fields.title,
    url: assetUrl(fields.file.url),
    width: fields.file.details?.image?.width,
    height: fields.file.details?.image?.height,
  }));

const section = z
  .object({
    sys: z.object({ id: z.string() }),
    fields: z.object({
      slug: z.string(),
      title: z.string(),
      content: z.custom<Document>(
        (value) => isRichTextNode(value) && value.nodeType === "document",
      ),
    }),
  })
  .transform(({ sys, fields }) => ({ id: sys.id, ...fields }));

const page = z
  .object({
    sys: z.object({ id: z.string() }),
    fields: z.object({
      slug: z.string(),
      title: z.string(),
      description: z.string().optional(),
      banner: imageSchema.optional(),
      sections: z.array(section).default([]),
    }),
  })
  .transform(({ sys, fields }) => ({ id: sys.id, ...fields }));

const site = z
  .object({
    fields: z.object({
      websiteName: z.string(),
      description: z.string().default(""),
      copyright: z.string().default(""),
      email: z.string().default(""),
      shareImage: imageSchema.optional(),
      pages: z.tuple(
        [page.transform((p) => ({ ...p, isHome: true }))],
        page.transform((p) => ({ ...p, isHome: false })),
      ),
    }),
  })
  .transform(({ fields }) => ({
    name: fields.websiteName,
    description: fields.description,
    copyright: fields.copyright,
    email: fields.email,
    shareImage: fields.shareImage,
    pages: fields.pages,
  }));

export type Image = z.output<typeof imageSchema>;
export type Section = z.output<typeof section>;
export type Page = Site["pages"][number];
export type Site = z.output<typeof site>;

function isRichTextNode(value: unknown): value is { nodeType: string } {
  if (!value || typeof value !== "object" || !("nodeType" in value)) return false;
  const node = value as Record<string, unknown>;
  if (typeof node.nodeType !== "string" || !node.data || typeof node.data !== "object")
    return false;
  if (node.nodeType === "text") {
    return (
      typeof node.value === "string" &&
      Array.isArray(node.marks) &&
      node.marks.every((mark) => mark && typeof mark.type === "string")
    );
  }
  return Array.isArray(node.content) && node.content.every(isRichTextNode);
}

export type LinkDiagnostic = {
  reason: "missing" | "cyclic";
  linkType: string;
  id: string;
};

function resolveLinks(
  value: unknown,
  byId: Map<string, unknown>,
  ancestors: Set<string>,
  diagnostics: Map<string, LinkDiagnostic>,
): unknown {
  if (Array.isArray(value)) {
    return value
      .map((item) => resolveLinks(item, byId, ancestors, diagnostics))
      .filter((item) => item !== undefined);
  }
  if (value === null || typeof value !== "object") return value;

  const asLink = link.safeParse(value);
  if (asLink.success) {
    const { id, linkType } = asLink.data.sys;
    if (linkType !== "Entry" && linkType !== "Asset") return undefined;
    const key = `${linkType}:${id}`;
    const target = byId.get(key);
    if (target === undefined || ancestors.has(key)) {
      const reason = target === undefined ? "missing" : "cyclic";
      diagnostics.set(`${reason}:${key}`, { reason, linkType, id });
      return undefined;
    }
    return resolveLinks(target, byId, new Set(ancestors).add(key), diagnostics);
  }

  const resolved = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      resolveLinks(child, byId, ancestors, diagnostics),
    ]),
  );
  if (
    "nodeType" in value &&
    "data" in value &&
    value.data &&
    typeof value.data === "object" &&
    "target" in value.data
  ) {
    const target = link.safeParse(value.data.target);
    if (
      target.success &&
      target.data.sys.linkType === "Entry" &&
      resolved.data &&
      typeof resolved.data === "object"
    ) {
      resolved.data = { ...resolved.data, targetId: target.data.sys.id };
    }
  }
  return resolved;
}

export function parseSiteWithDiagnostics(raw: unknown): {
  site: Site;
  diagnostics: LinkDiagnostic[];
} {
  const body = entriesResponse.parse(raw);
  const byId = new Map<string, unknown>([
    ...body.includes.Entry.map((item) => [`Entry:${item.sys.id}`, item] as const),
    ...body.includes.Asset.map((item) => [`Asset:${item.sys.id}`, item] as const),
  ]);
  const diagnostics = new Map<string, LinkDiagnostic>();
  const parsed = site.parse(resolveLinks(body.items[0], byId, new Set(), diagnostics));
  return { site: parsed, diagnostics: [...diagnostics.values()] };
}

export function parseSite(raw: unknown): Site {
  return parseSiteWithDiagnostics(raw).site;
}

const warnedLinks = new Set<string>();

export async function fetchSite(spaceId: string, accessToken: string): Promise<Site> {
  const url = new URL(`https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries`);
  url.searchParams.set("content_type", "master");
  url.searchParams.set("include", "3");

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    throw new Error(`Contentful responded ${response.status} ${response.statusText}`);
  }

  const result = parseSiteWithDiagnostics(await response.json());
  for (const { reason, linkType, id } of result.diagnostics) {
    const key = `${reason}:${linkType}:${id}`;
    if (!warnedLinks.has(key)) {
      warnedLinks.add(key);
      console.warn(`Contentful omitted ${reason} reference ${linkType}:${id}.`);
    }
  }
  return result.site;
}
