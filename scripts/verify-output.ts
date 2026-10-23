import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { SITE_ORIGIN } from "../src/content/page-head";

const [directory = "dist/client", source = "contentful"] = process.argv.slice(2);
assert.ok(source === "contentful" || source === "fixture", "Expected contentful or fixture source");
const read = (file: string) => readFile(path.join(directory, file), "utf8");
const decode = (text: string) =>
  text
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
function tags(html: string, tag: string) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "g"))].map(([text]) =>
    Object.fromEntries(
      [...text.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value!)]),
    ),
  );
}
function meta(html: string, name: string) {
  return tags(html, "meta").filter((tag) => tag.name === name || tag.property === name);
}
function singleMeta(html: string, name: string) {
  const matches = meta(html, name);
  assert.equal(matches.length, 1, `Expected one ${name}`);
  assert.ok(matches[0]?.content, `Empty ${name}`);
  return matches[0]!.content!;
}

const sitemap = await read("sitemap.xml");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => new URL(decode(url!)));
assert.ok(urls.length > 0, "Sitemap has no content routes");
assert.equal(new Set(urls.map((url) => url.href)).size, urls.length, "Duplicate sitemap routes");
assert.ok(
  urls.some((url) => url.pathname === "/"),
  "Missing homepage",
);
const titles = new Set();
const descriptions = new Set();
for (const url of urls) {
  assert.equal(url.origin, SITE_ORIGIN);
  const htmlFile =
    url.pathname === "/" ? "index.html" : `${decodeURIComponent(url.pathname.slice(1))}.html`;
  const html = await read(htmlFile);
  const title = [...html.matchAll(/<title>([^<]+)<\/title>/g)];
  assert.equal(title.length, 1, `Expected one title in ${htmlFile}`);
  assert.ok(title[0]?.[1], `Empty title in ${htmlFile}`);
  titles.add(decode(title[0]![1]!));
  const description = singleMeta(html, "description");
  descriptions.add(description);
  assert.equal(singleMeta(html, "og:description"), description);
  assert.equal(singleMeta(html, "og:title"), decode(title[0]![1]!));
  const canonical = tags(html, "link").filter((tag) => tag.rel === "canonical");
  assert.deepEqual(
    canonical.map((tag) => tag.href),
    [url.href],
    `Canonical mismatch in ${htmlFile}`,
  );
  assert.equal(singleMeta(html, "og:url"), url.href);
  assert.equal(singleMeta(html, "og:type"), "website");
  assert.equal(singleMeta(html, "og:locale"), "fr_BE");
  assert.equal(singleMeta(html, "content-source"), source);
  assert.ok(singleMeta(html, "og:image").startsWith("https://"));
  assert.match(html, /id="main-content"/);
  assert.match(html, /href="#main-content"/);
  assert.match(html, /<h1\b/);
  assert.equal(singleMeta(html, "twitter:card"), "summary_large_image");
  assert.equal(tags(html, "link").filter((tag) => tag.rel === "mask-icon").length, 0);
  assert.equal(meta(html, "msapplication-TileColor").length, 0);
  if (source === "fixture") assert.match(singleMeta(html, "robots"), /noindex/);
  else
    assert.ok(
      !meta(html, "robots").some((tag) => /noindex/i.test(tag.content ?? "")),
      `Production page ${htmlFile} must allow indexing`,
    );
}
assert.equal(titles.size, urls.length, "Page titles must be distinct");
assert.equal(descriptions.size, urls.length, "Page descriptions must be distinct");

const notFound = await read("404.html");
assert.match(notFound, /<title>Page introuvable/);
assert.match(singleMeta(notFound, "robots"), /noindex/);
assert.match(notFound, /id="main-content"/);
assert.match(notFound, /href="#main-content"/);
assert.equal(tags(notFound, "link").filter((tag) => tag.rel === "canonical").length, 0);
const manifest = JSON.parse(await read("manifest.json"));
assert.ok(manifest.name?.trim() && manifest.short_name?.trim(), "Manifest names are required");
assert.match(await read("robots.txt"), /Sitemap: https:\/\/jeunonsensemble\.be\/sitemap\.xml/);
const files = await readdir(directory, { recursive: true });
const staticPayloads = files.filter((file) => file.startsWith("__tsr/") && file.endsWith(".json"));
assert.ok(staticPayloads.length, "Missing static server function payloads");
if (source === "contentful") {
  for (const artifact of files.filter((name) => /\.(?:html|json)$/.test(name))) {
    const text = await read(artifact);
    assert.ok(
      !/name="content-source" content="fixture"/.test(text),
      `Fixture marker in ${artifact}`,
    );
    assert.ok(!text.includes("Ce contenu fictif"), `Fixture content in ${artifact}`);
    assert.ok(!text.includes("bonjour@example.com"), `Fixture contact in ${artifact}`);
  }
}
console.log(
  `Verified ${urls.length} content pages, 404, sitemap, manifest, and ${staticPayloads.length} static payload(s) in ${directory} (${source}).`,
);
