import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import type { Page } from "../content/site";

type Props = {
  page: Pick<Page, "slug" | "isHome">;
  hash?: string;
  className?: string;
  "aria-label"?: string;
  onClick?: () => void;
  children: ReactNode;
};

export function PageLink({ page, ...props }: Props) {
  return page.isHome ? (
    <Link to="/" {...props} />
  ) : (
    <Link to="/$slug" params={{ slug: page.slug }} {...props} />
  );
}
