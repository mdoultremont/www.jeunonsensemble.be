import { createLink } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";

import type { Page } from "../content/site";

type Props = {
  page: Pick<Page, "slug" | "isHome">;
  hash?: string;
  className?: string;
  "aria-label"?: string;
  onClick?: () => void;
  children: ReactNode;
};

const Link = createLink(function PageAnchor(props: ComponentProps<"a">) {
  return (
    <a
      {...props}
      aria-current={
        props.href?.includes("#") && props["aria-current"] ? "location" : props["aria-current"]
      }
    >
      {props.children}
    </a>
  );
});

export function PageLink({ page, hash, ...props }: Props) {
  const activeOptions = { exact: true, includeHash: Boolean(hash) };
  return page.isHome ? (
    <Link to="/" hash={hash} activeOptions={activeOptions} {...props} />
  ) : (
    <Link
      to="/$slug"
      params={{ slug: page.slug }}
      hash={hash}
      activeOptions={activeOptions}
      {...props}
    />
  );
}
