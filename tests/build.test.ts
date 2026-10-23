import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("the default build source fails before writing output when its token is missing", () => {
  const result = spawnSync("pnpm", ["exec", "vite", "build"], {
    env: { ...process.env, CONTENT_SOURCE: "contentful", CONTENTFUL_ACCESS_TOKEN: "" },
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CONTENTFUL_ACCESS_TOKEN is required/);
  assert.ok(!result.stdout.includes("building client environment"));
});
