import { createFileRoute, notFound } from "@tanstack/react-router";

import { PageView } from "../components/PageView";

export const Route = createFileRoute("/")({
  loader: async ({ parentMatchPromise }) => {
    const { loaderData: site } = await parentMatchPromise;
    const page = site?.pages.find((p) => p.isHome);
    if (!page) throw notFound();
    return page;
  },
  component: function Home() {
    return <PageView page={Route.useLoaderData()} />;
  },
});
