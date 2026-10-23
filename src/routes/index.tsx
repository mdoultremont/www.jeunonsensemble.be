import { createFileRoute, notFound } from "@tanstack/react-router";

import { pageHead } from "../content/page-head";

import { PageView } from "../components/PageView";

export const Route = createFileRoute("/")({
  loader: async ({ parentMatchPromise }) => {
    const { loaderData: site } = await parentMatchPromise;
    const page = site?.pages.find((p) => p.isHome);
    if (!site || !page) throw notFound();
    return { page, site };
  },
  head: ({ loaderData }) => (loaderData ? pageHead(loaderData.page, loaderData.site) : {}),
  component: function Home() {
    return <PageView page={Route.useLoaderData().page} />;
  },
});
