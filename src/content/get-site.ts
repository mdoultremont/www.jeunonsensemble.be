import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

import { fetchSite } from "./site";

const SPACE_ID = "v9fs1t81g1do";

// Runs only while prerendering. The result is baked into each page and saved
// as a static JSON file that client-side navigation reads instead of the server.
export const getSite = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(() => {
    const token = process.env.CONTENTFUL_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        "CONTENTFUL_ACCESS_TOKEN is not set. Add it to .env, or to the build variables in Workers Builds.",
      );
    }
    return fetchSite(SPACE_ID, token);
  });
