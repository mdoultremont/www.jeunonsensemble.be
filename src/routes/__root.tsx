import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Footer } from "../components/Footer";
import { NotFound } from "../components/NotFound";
import { getSite } from "../content/get-site";
import styles from "../styles.css?url";

export const Route = createRootRoute({
  loader: () => getSite(),
  staleTime: Infinity,
  head: ({ loaderData: site }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: site?.name },
      { name: "description", content: site?.description },
      { name: "theme-color", content: "#2680c2" },
      { name: "msapplication-TileColor", content: "#f0f4f8" },
      { property: "og:site_name", content: site?.name },
      { property: "og:description", content: site?.description },
      { property: "og:image", content: "https://jeunonsensemble.be/og-image.jpg" },
      { property: "og:image:width", content: "1145" },
      { property: "og:image:height", content: "599" },
    ],
    links: [
      { rel: "stylesheet", href: styles },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#2680c2" },
    ],
  }),
  shellComponent: Document,
  component: Layout,
  notFoundComponent: NotFound,
});

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body className="bg-grey-lightest font-sans leading-[1.15] text-grey-darkest antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Layout() {
  return (
    <>
      <Outlet />
      <Footer />
    </>
  );
}
