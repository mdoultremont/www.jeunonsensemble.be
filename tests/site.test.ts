import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { parseSite, parseSiteWithDiagnostics, fetchSite } from "../src/content/site";

const fixture = JSON.parse(
  await readFile(new URL("./fixtures/contentful.json", import.meta.url), "utf8"),
);
const fresh = () => structuredClone(fixture);
const link = (id: string, linkType = "Entry") => ({ sys: { type: "Link", linkType, id } });

test("resolves shared sections at every placement without mutating the response", () => {
  const input = fresh();
  const site = parseSite(input);
  assert.equal(site.pages.length, 6);
  assert.equal(site.pages[0]?.slug, "/");
  assert.equal(site.pages[0]?.isHome, true);
  assert.equal(site.pages[1]?.isHome, false);
  for (const page of site.pages) assert.equal(page.sections[1]?.title, "Une expérience partagée");
  assert.deepEqual(input, fixture);
});

test("resolves nested rich text assets and preserves optional image dimensions", () => {
  const site = parseSite(fresh());
  const embedded = site.pages[0]!.sections[0]!.content.content.find(
    (node) => node.nodeType === "embedded-asset-block",
  );
  assert.equal(embedded?.data.target.fields.file.url, "/og-image.jpg");
  assert.equal(site.pages[0]?.banner?.width, 1145);
  assert.equal(site.shareImage?.height, 599);
  const input = fresh();
  delete input.includes.Asset[0].fields.file.details;
  assert.equal(parseSite(input).shareImage?.width, undefined);
});

test("omits missing and cyclic links but keeps independent shared branches", () => {
  const input = fresh();
  const page = input.includes.Entry.find(
    (entry: { sys: { id: string } }) => entry.sys.id === "page-0",
  );
  page.fields.banner = link("unpublished", "Asset");
  page.fields.sections.push(link("unpublished"));
  const shared = input.includes.Entry.find(
    (entry: { sys: { id: string } }) => entry.sys.id === "shared",
  );
  shared.fields.content.content.push({
    nodeType: "embedded-entry-block",
    content: [],
    data: { target: link("shared") },
  });
  const site = parseSite(input);
  assert.equal(site.pages[0]?.banner, undefined);
  assert.equal(site.pages[0]?.sections.length, 2);
  for (const resolvedPage of site.pages) {
    assert.equal(resolvedPage.sections[1]?.content.content.at(-1)?.data.target, undefined);
  }
});

test("namespaces asset and entry links with the same ID", () => {
  const input = fresh();
  input.includes.Asset.push({
    sys: { id: "shared" },
    fields: { file: { url: "//images.ctfassets.net/example.jpg" } },
  });
  const site = parseSite(input);
  assert.equal(site.pages[0]?.sections[1]?.slug, "partage");
});

test("rejects malformed root, required fields, and malformed rich text", () => {
  for (const raw of [
    null,
    {},
    { items: [] },
    { items: [{ fields: { websiteName: "Test", pages: [] } }] },
  ]) {
    assert.throws(() => parseSite(raw));
  }
  const input = fresh();
  input.includes.Entry[0].fields.content = {
    nodeType: "document",
    data: {},
    content: [{ nodeType: "paragraph" }],
  };
  assert.throws(() => parseSite(input));
});

test("supports optional page descriptions", () => {
  const input = fresh();
  const page = input.includes.Entry.find(
    (entry: { sys: { id: string } }) => entry.sys.id === "page-0",
  );
  page.fields.description = "Description éditoriale.";
  assert.equal(parseSite(input).pages[0]?.description, "Description éditoriale.");
});

test("transport requests enough link depth and passes credentials only as a header", async (context) => {
  let requested = false;
  context.mock.method(globalThis, "fetch", async (input: URL, init: RequestInit) => {
    requested = true;
    assert.equal(input.searchParams.get("include"), "3");
    assert.equal(input.searchParams.has("access_token"), false);
    assert.deepEqual(init.headers, { Authorization: "Bearer test-only" });
    return Response.json(fixture);
  });
  assert.equal((await fetchSite("test-space", "test-only")).pages.length, 6);
  assert.equal(requested, true);
});

test("pure diagnostics collect omitted IDs once and fetching warns once without payloads", async (context) => {
  const input = fresh();
  input.includes.Entry.find(
    (entry: { sys: { id: string } }) => entry.sys.id === "page-0",
  ).fields.banner = link("diagnostic-asset", "Asset");
  input.items[0].sys.space = link("metadata-space", "Space");
  const warnings: string[] = [];
  context.mock.method(console, "warn", (message: string) => warnings.push(message));
  const { diagnostics } = parseSiteWithDiagnostics(input);
  assert.equal(warnings.length, 0);
  assert.ok(!diagnostics.some((item) => item.id === "metadata-space"));
  assert.equal(diagnostics.filter((item) => item.id === "diagnostic-asset").length, 1);
  assert.ok(diagnostics.some((item) => item.reason === "cyclic" && item.id === "shared"));
  assert.equal(
    new Set(diagnostics.map((item) => `${item.reason}:${item.linkType}:${item.id}`)).size,
    diagnostics.length,
  );
  context.mock.method(globalThis, "fetch", async () => Response.json(input));
  await fetchSite("diagnostic-space", "private-test-token");
  await fetchSite("diagnostic-space", "private-test-token");
  assert.deepEqual(
    warnings.filter((message) => message.includes("diagnostic-asset")),
    ["Contentful omitted missing reference Asset:diagnostic-asset."],
  );
  assert.ok(
    !warnings.some(
      (message) => message.includes("private-test-token") || message.includes("fields"),
    ),
  );
});
