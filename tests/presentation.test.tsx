import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";

import { RichText } from "../src/components/RichText";
import { assetUrl, bannerSources, imageUrl } from "../src/content/asset-url";
import { pageHead, pagePath } from "../src/content/page-head";
import { parseSite, type Page } from "../src/content/site";

const raw = JSON.parse(
  await readFile(new URL("./fixtures/contentful.json", import.meta.url), "utf8"),
);
const site = parseSite(raw);

test("metadata uses useful prose, unique routes, and the CMS image", () => {
  const descriptions = new Set();
  for (const page of site.pages) {
    const head = pageHead(page, site);
    const description = head.meta.find(
      (tag) => "name" in tag && tag.name === "description",
    )?.content;
    assert.ok(description?.includes("Ce contenu fictif"));
    assert.ok(!description?.includes("Citation"));
    assert.ok(!description?.includes("Auteur"));
    descriptions.add(description);
    assert.equal(head.links[0]?.href, `https://jeunonsensemble.be${pagePath(page)}`);
    assert.equal(
      head.meta.find((tag) => "property" in tag && tag.property === "og:image")?.content,
      "https://jeunonsensemble.be/og-image.jpg",
    );
  }
  assert.equal(descriptions.size, site.pages.length);
});

test("CMS share images override the local fallback and emit only known dimensions", () => {
  const customSite = {
    ...site,
    shareImage: {
      title: "CMS image",
      url: "https://images.ctfassets.net/test/share.jpg",
      width: 1200,
      height: 630,
    },
  };
  const tags = pageHead(site.pages[0]!, customSite).meta;
  assert.equal(
    tags.find((tag) => "property" in tag && tag.property === "og:image")?.content,
    "https://images.ctfassets.net/test/share.jpg",
  );
  assert.equal(
    tags.find((tag) => "property" in tag && tag.property === "og:image:width")?.content,
    "1200",
  );
  assert.equal(
    tags.find((tag) => "property" in tag && tag.property === "og:image:height")?.content,
    "630",
  );
  const unknownSize = pageHead(site.pages[0]!, {
    ...site,
    shareImage: { ...customSite.shareImage, width: undefined, height: undefined },
  }).meta;
  assert.ok(!unknownSize.some((tag) => "property" in tag && tag.property === "og:image:width"));
  const fallback = pageHead(site.pages[0]!, { ...site, shareImage: undefined }).meta;
  assert.equal(
    fallback.find((tag) => "property" in tag && tag.property === "og:image")?.content,
    "https://jeunonsensemble.be/og-image.jpg",
  );
});

test("description overrides and clipping normalize whitespace and keep word boundaries", () => {
  const page = { ...site.pages[0]!, description: "  Une   description éditoriale.  " };
  assert.equal(pageHead(page, site).meta[1]?.content, "Une description éditoriale.");
  page.description = "Une description très longue ".repeat(20);
  const result = pageHead(page, site).meta[1]?.content;
  assert.ok(result && result.length <= 180);
  assert.match(result!, /(?:longue|description|très|Une)…$/);
});

test("image transforms preserve queries and only modify Contentful image hosts", () => {
  const url = imageUrl("//images.ctfassets.net/space/image.jpg?fit=fill&w=500", 384);
  const parsed = new URL(url);
  assert.equal(parsed.protocol, "https:");
  assert.equal(parsed.searchParams.get("fit"), "fill");
  assert.equal(parsed.searchParams.get("w"), "384");
  assert.equal(parsed.searchParams.get("fm"), "webp");
  assert.equal(imageUrl("https://example.com/a.png?x=1", 384), "https://example.com/a.png?x=1");
  assert.equal(imageUrl("/og-image.jpg", 384), "/og-image.jpg");
  assert.equal(bannerSources("/og-image.jpg", 1145), undefined);
  assert.equal(assetUrl("//example.com/a"), "https://example.com/a");
  const candidates = bannerSources("//images.ctfassets.net/a.jpg", 1020)!;
  assert.match(candidates, /1020w$/);
  assert.ok(!candidates.includes("1280w"));
  assert.ok(!candidates.includes("2400w"));
  const large = bannerSources("//images.ctfassets.net/a.jpg", 6000)!;
  assert.match(large, /2400w$/);
  assert.ok(!large.includes("6000"));
});

async function renderRichText(page: Page, section = page.sections[0]!, path = pagePath(page)) {
  const root = createRootRoute({
    component: () => <RichText document={section.content} site={site} page={page} />,
  });
  const slug = createRoute({ getParentRoute: () => root, path: "$slug" });
  const router = createRouter({
    routeTree: root.addChildren([slug]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  return renderToStaticMarkup(<RouterProvider router={router} />);
}

test("rich text omits blank paragraphs, keeps same-tab navigation, and lazy-loads assets", async () => {
  const html = await renderRichText(site.pages[0]);
  assert.ok(!html.includes("<p></p>"));
  assert.match(html, /href="mailto:bonjour@example.com"/);
  assert.match(html, /href="\/programme"/);
  assert.ok(!html.includes('target="_blank"'));
  assert.match(html, /loading="lazy"/);
  assert.match(html, /width="1145"/);
});

test("entry hyperlinks and embeds use actual page and section destinations without debug text", async () => {
  const html = await renderRichText(site.pages[0]);
  assert.match(html, /href="\/programme"[^>]*>Programme lié<\/a>/);
  assert.match(html, /href="\/programme#section-1"[^>]*>Section du programme<\/a>/);
  assert.equal((html.match(/>Programme<\/a>/g) ?? []).length, 3);
  assert.match(html, /Contenu indisponible/);
  assert.match(html, /Entrée sans destination/);
  assert.ok(!html.includes("type: "));
  assert.ok(!html.includes("id: "));
  assert.match(html, /href="\/programme\?origine=test#section-1"/);
  assert.match(html, /href="https:\/\/example.com\/document"/);
});

test("shared entry sections prefer the current page and otherwise use their first owner", async () => {
  const current = site.pages[2]!;
  const shared = current.sections[1]!;
  assert.match(
    await renderRichText(current, shared),
    /href="\/pourquoi#partage"[^>]*>Partage local/,
  );
  assert.match(
    await renderRichText(current, site.pages[0].sections[0]!),
    /href="\/programme#section-1"[^>]*>Section du programme/,
  );
});
