import { documentToReactComponents, type Options } from "@contentful/rich-text-react-renderer";
import { Link } from "@tanstack/react-router";
import { Children, type ReactNode } from "react";
import {
  BLOCKS,
  INLINES,
  type Block,
  type Inline,
  type Document,
} from "@contentful/rich-text-types";

import { assetUrl, imageUrl } from "../content/asset-url";
import { SITE_ORIGIN, pagePath } from "../content/page-head";
import type { Page, Site } from "../content/site";
import { PageLink } from "./PageLink";

function richTextOptions(site: Site, page: Page): Options {
  function renderEntry(node: Block | Inline, children: ReactNode) {
    const target = node.data.target;
    const id = node.data.targetId ?? target?.sys?.id;
    const label = Children.count(children)
      ? children
      : typeof target?.fields?.title === "string"
        ? target.fields.title
        : null;
    const targetPage = site.pages.find((candidate) => candidate.id === id);
    if (targetPage) return <PageLink page={targetPage}>{label || targetPage.title}</PageLink>;
    const owner = [page, ...site.pages].find((candidate) =>
      candidate.sections.some((section) => section.id === id),
    );
    const section = owner?.sections.find((candidate) => candidate.id === id);
    if (owner && section) {
      return (
        <PageLink page={owner} hash={section.slug}>
          {label || section.title}
        </PageLink>
      );
    }
    return <>{label}</>;
  }

  return {
    renderNode: {
      [BLOCKS.PARAGRAPH]: (node, children) => {
        if (node.content.every((child) => child.nodeType === "text" && !child.value.trim()))
          return null;
        return <p>{children}</p>;
      },
      [BLOCKS.UL_LIST]: (_, children) => <ul className="list-disc pl-10">{children}</ul>,
      [BLOCKS.OL_LIST]: (_, children) => <ol className="list-decimal pl-10">{children}</ol>,
      [BLOCKS.QUOTE]: (_, children) => (
        <blockquote className="text-grey-darker">{children}</blockquote>
      ),
      [BLOCKS.HR]: () => <hr className="my-6 w-24 border-0 border-b-2 border-blue" />,
      [BLOCKS.EMBEDDED_ASSET]: (node) => {
        const fields = node.data.target?.fields;
        if (typeof fields?.file?.url !== "string") return null;
        return (
          <img
            className="my-4 h-48 w-64 max-w-full rounded-lg object-cover shadow-lg"
            src={imageUrl(fields.file.url, Math.min(fields.file.details?.image?.width ?? 512, 512))}
            width={fields.file.details?.image?.width}
            height={fields.file.details?.image?.height}
            alt={fields.title ?? ""}
            loading="lazy"
          />
        );
      },
      [INLINES.ENTRY_HYPERLINK]: renderEntry,
      [INLINES.EMBEDDED_ENTRY]: renderEntry,
      [BLOCKS.EMBEDDED_ENTRY]: (node, children) => <div>{renderEntry(node, children)}</div>,
      [INLINES.HYPERLINK]: (node, children) => {
        const uri = node.data.uri;
        try {
          const url = new URL(uri, `${SITE_ORIGIN}${pagePath(page)}`);
          const hostname = new URL(SITE_ORIGIN).hostname;
          if (
            (url.protocol === "https:" || url.protocol === "http:") &&
            (url.hostname === hostname || url.hostname === `www.${hostname}`)
          ) {
            return (
              <Link
                to={url.pathname}
                hash={url.hash.slice(1)}
                search={Object.fromEntries(url.searchParams)}
              >
                {children}
              </Link>
            );
          }
        } catch {
          return <>{children}</>;
        }
        return <a href={uri}>{children}</a>;
      },
      [INLINES.ASSET_HYPERLINK]: (node, children) => {
        const url = node.data.target?.fields?.file?.url;
        if (typeof url !== "string") return <>{children}</>;
        return <a href={assetUrl(url)}>{children}</a>;
      },
    },
  };
}

export function RichText({ document, site, page }: { document: Document; site: Site; page: Page }) {
  return <>{documentToReactComponents(document, richTextOptions(site, page))}</>;
}
