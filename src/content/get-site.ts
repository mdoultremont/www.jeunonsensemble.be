import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

import { fetchSite } from "./site";

export const getSite = createServerFn({ method: "GET" }).handler(() =>
  fetchSite(env.CONTENTFUL_SPACE_ID, env.CONTENTFUL_ACCESS_TOKEN),
);
