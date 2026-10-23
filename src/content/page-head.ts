import type { Block, Inline, Text } from "@contentful/rich-text-types";

import type { Page, Site } from "./site";

export const SITE_ORIGIN = "https://jeunonsensemble.be";

export function pagePath(page: Pick<Page, "isHome" | "slug">) {
  return page.isHome ? "/" : `/${page.slug}`;
}

function plainText(node: Block | Inline | Text): string {
  if (node.nodeType === "text" && "value" in node) return node.value;
  return "content" in node ? node.content.map((child) => plainText(child)).join(" ") : "";
}

export function pageHead(page: Page, site: Site) {
  const summary = page.sections
    .flatMap((section) => section.content.content)
    .filter((node) => node.nodeType === "paragraph")
    .map((node) => plainText(node).replace(/\s+/g, " ").trim())
    .find((text) => text.length >= 60 && !/^\([^)]*\)$/.test(text));
  const normalized = (
    page.description?.trim() || `${page.title} : ${summary || site.description || site.name}`
  )
    .replace(/\s+/g, " ")
    .trim();
  const description =
    normalized.length <= 180 ? normalized : `${normalized.slice(0, 177).replace(/\s+\S*$/, "")}…`;
  const url = `${SITE_ORIGIN}${pagePath(page)}`;
  const image = site.shareImage || { url: `${SITE_ORIGIN}/og-image.jpg`, width: 1145, height: 599 };
  return {
    meta: [
      { title: `${page.title} · ${site.name}` },
      { name: "description", content: description },
      { property: "og:title", content: `${page.title} · ${site.name}` },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "fr_BE" },
      { property: "og:image", content: new URL(image.url, SITE_ORIGIN).href },
      ...(image.width ? [{ property: "og:image:width", content: String(image.width) }] : []),
      ...(image.height ? [{ property: "og:image:height", content: String(image.height) }] : []),
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function notFoundHead() {
  return {
    meta: [
      { title: "Page introuvable · Jeûnons Ensemble" },
      { name: "robots", content: "noindex" },
    ],
  };
}
