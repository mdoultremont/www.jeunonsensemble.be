import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

import fixture from "../../tests/fixtures/contentful.json";

import { parseSite, fetchSite } from "./site";

import { SPACE_ID } from "./contentful";

// Runs only while prerendering. The result is baked into each page and saved
// as a static JSON file that client-side navigation reads instead of the server.
export const getSite = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(() => {
    if (import.meta.env.CONTENT_SOURCE === "fixture") return parseSite(fixture);
    const token = process.env.CONTENTFUL_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        "CONTENTFUL_ACCESS_TOKEN is not set. Add it to .env, or to the build variables in Workers Builds.",
      );
    }
    return fetchSite(SPACE_ID, token);
  });
