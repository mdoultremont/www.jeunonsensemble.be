import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const source = env.CONTENT_SOURCE || "contentful";
  if (source !== "contentful" && source !== "fixture") {
    throw new Error("CONTENT_SOURCE must be contentful or fixture.");
  }
  if (source === "contentful" && !env.CONTENTFUL_ACCESS_TOKEN?.trim()) {
    throw new Error("CONTENTFUL_ACCESS_TOKEN is required for Contentful builds and development.");
  }
  return {
    build: { outDir: source === "fixture" ? "dist-fixture" : "dist" },
    define: {
      "import.meta.env.CONTENT_SOURCE": JSON.stringify(source),
      "import.meta.env.SITE_NOINDEX": JSON.stringify(
        source === "fixture" || env.SITE_NOINDEX === "1",
      ),
    },
    plugins: [
      tailwindcss(),
      tanstackStart({
        prerender: {
          enabled: true,
          crawlLinks: true,
          autoSubfolderIndex: false,
          filter: (page) => !page.path.includes("#"),
        },
        pages: [{ path: "/404", prerender: { outputPath: "/404.html" } }, { path: "/sitemap.xml" }],
      }),
      react(),
    ],
  };
});
