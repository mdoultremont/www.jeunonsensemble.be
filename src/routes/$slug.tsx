import { createFileRoute, notFound } from "@tanstack/react-router";

import { pageHead, notFoundHead } from "../content/page-head";

import { PageView } from "../components/PageView";

export const Route = createFileRoute("/$slug")({
  loader: async ({ params, parentMatchPromise }) => {
    const { loaderData: site } = await parentMatchPromise;
    const page = site?.pages.find((p) => !p.isHome && p.slug === params.slug);
    if (!site || !page) throw notFound();
    return { page, site };
  },
  head: ({ loaderData }) =>
    loaderData ? pageHead(loaderData.page, loaderData.site) : notFoundHead(),
  component: function ContentPage() {
    return <PageView page={Route.useLoaderData().page} />;
  },
});
