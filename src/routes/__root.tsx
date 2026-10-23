import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { Suspense, type ReactNode } from "react";

import { Footer } from "../components/Footer";
import { NotFound } from "../components/NotFound";
import { notFoundHead } from "../content/page-head";
import { getSite } from "../content/get-site";
import rubikLatin from "@fontsource-variable/rubik/files/rubik-latin-wght-normal.woff2?url";
import styles from "../styles.css?url";

export const Route = createRootRoute({
  loader: () => getSite(),
  staleTime: Infinity,
  head: ({ loaderData: site, match: { _notFound: rootNotFound, status } }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#2680c2" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "content-source", content: import.meta.env.CONTENT_SOURCE },
      ...(import.meta.env.SITE_NOINDEX ? [{ name: "robots", content: "noindex" }] : []),
      { property: "og:site_name", content: site?.name },
      // Unmatched nested paths render the root as their leaf after hydration.
      ...(rootNotFound || status === "notFound" ? notFoundHead().meta : []),
    ],
    links: [
      { rel: "stylesheet", href: styles },
      {
        rel: "preload",
        href: rubikLatin,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: Document,
  component: Layout,
  notFoundComponent: function RootNotFound() {
    // Match the Outlet boundary in the prerendered /404 shell.
    return (
      <Suspense fallback={null}>
        <NotFound />
      </Suspense>
    );
  },
});

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body className="bg-grey-lightest font-sans text-grey-darkest antialiased">
        <a href="#main-content" className="skip-link">
          Aller au contenu
        </a>
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
