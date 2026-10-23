import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

test("both deployment entry points reject fixture mode before building or invoking Wrangler", () => {
  for (const action of ["deploy", "preview"]) {
    const result = spawnSync(process.execPath, ["scripts/deploy.mjs", action], {
      env: { ...process.env, CONTENT_SOURCE: "fixture" },
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Deployment requires CONTENT_SOURCE=contentful/);
    assert.ok(!result.stdout.includes("vite"));
    assert.ok(!result.stdout.includes("wrangler"));
  }
});

test("the default build source fails before writing output when its token is missing", () => {
  const result = spawnSync("pnpm", ["exec", "vite", "build"], {
    env: { ...process.env, CONTENT_SOURCE: "contentful", CONTENTFUL_ACCESS_TOKEN: "" },
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CONTENTFUL_ACCESS_TOKEN is required/);
  assert.ok(!result.stdout.includes("building client environment"));
});

test("production deployment rejects noindex from process and loaded build environment", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "jeunons-deploy-"));
  try {
    await writeFile(path.join(directory, ".env"), "SITE_NOINDEX=1\n");
    for (const loaded of [false, true]) {
      const env: NodeJS.ProcessEnv = { ...process.env, CONTENT_SOURCE: "contentful" };
      if (loaded) delete env.SITE_NOINDEX;
      else env.SITE_NOINDEX = "1";
      const result = spawnSync(process.execPath, [path.resolve("scripts/deploy.mjs"), "deploy"], {
        cwd: loaded ? directory : process.cwd(),
        env,
        encoding: "utf8",
      });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Production deployment requires SITE_NOINDEX/);
      assert.equal(result.stdout, "");
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("preview deployment forces noindex and explicit preview verification without running deployment tools", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "jeunons-preview-"));
  try {
    await writeFile(
      path.join(directory, "pnpm"),
      `#!/usr/bin/env node
console.log(JSON.stringify({ args: process.argv.slice(2), noindex: process.env.SITE_NOINDEX, source: process.env.CONTENT_SOURCE }));
`,
      { mode: 0o755 },
    );
    const result = spawnSync(process.execPath, ["scripts/deploy.mjs", "preview"], {
      env: {
        ...process.env,
        PATH: `${directory}${path.delimiter}${process.env.PATH}`,
        CONTENT_SOURCE: "contentful",
        SITE_NOINDEX: "0",
      },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(
      result.stdout
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line)),
      [
        { args: ["run", "build"], noindex: "1", source: "contentful" },
        { args: ["run", "verify", "--preview"], noindex: "1", source: "contentful" },
        { args: ["exec", "wrangler", "preview"], noindex: "1", source: "contentful" },
      ],
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
