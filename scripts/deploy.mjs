import { spawnSync } from "node:child_process";
import { loadEnv } from "vite";

const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
if (env.CONTENT_SOURCE && env.CONTENT_SOURCE !== "contentful") {
  throw new Error("Deployment requires CONTENT_SOURCE=contentful. Fixture output is local only.");
}
const action = process.argv[2];
if (action !== "deploy" && action !== "preview") throw new Error("Expected deploy or preview.");
if (action === "deploy" && env.SITE_NOINDEX === "1") {
  throw new Error("Production deployment requires SITE_NOINDEX to be unset or disabled.");
}
for (const args of [
  ["run", "build"],
  ["run", "verify", ...(action === "preview" ? ["--preview"] : [])],
  ["exec", "wrangler", action],
]) {
  const result = spawnSync("pnpm", args, {
    stdio: "inherit",
    env: {
      ...process.env,
      CONTENT_SOURCE: "contentful",
      ...(action === "preview" ? { SITE_NOINDEX: "1" } : {}),
    },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
