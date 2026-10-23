import { getRouteApi, rootRouteId } from "@tanstack/react-router";

const root = getRouteApi(rootRouteId);

export function useSite() {
  return root.useLoaderData();
}
