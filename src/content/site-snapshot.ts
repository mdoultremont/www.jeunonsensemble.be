import { loadEnv, type Plugin } from "vite";

import { fetchSite, type Site } from "./site";

const SPACE_ID = "v9fs1t81g1do";
const MODULE_ID = "virtual:site";

// Content is a build input: the build fetches Contentful once and bakes the
// result into the Worker, so serving pages never spends Contentful API calls.
// Publishing in Contentful triggers a rebuild through a Workers Builds deploy hook.
export function siteSnapshot(): Plugin {
  let token: string | undefined;
  let site: Promise<Site> | undefined;

  return {
    name: "site-snapshot",
    configResolved(config) {
      token = loadEnv(
        config.mode,
        config.envDir || process.cwd(),
        "CONTENTFUL_",
      ).CONTENTFUL_ACCESS_TOKEN;
    },
    resolveId(id) {
      return id === MODULE_ID ? `\0${MODULE_ID}` : undefined;
    },
    async load(id) {
      if (id !== `\0${MODULE_ID}`) return undefined;
      if (!token) {
        throw new Error(
          "CONTENTFUL_ACCESS_TOKEN is not set. Add it to .env, or to the build variables in Workers Builds.",
        );
      }
      site ??= fetchSite(SPACE_ID, token);
      return `export default ${JSON.stringify(await site)};`;
    },
  };
}
