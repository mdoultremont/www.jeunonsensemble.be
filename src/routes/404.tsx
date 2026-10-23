import { createFileRoute } from "@tanstack/react-router";

import { NotFound } from "../components/NotFound";

// Prerendered to 404.html, which Workers Static Assets serves for unknown URLs.
export const Route = createFileRoute("/404")({
  component: NotFound,
});
