import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
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
});
