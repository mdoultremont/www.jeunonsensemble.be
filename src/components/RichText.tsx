import { documentToReactComponents, type Options } from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES, type Document } from "@contentful/rich-text-types";

import { assetUrl } from "../content/asset-url";

const options: Options = {
  renderNode: {
    [BLOCKS.UL_LIST]: (_, children) => <ul className="list-disc pl-10">{children}</ul>,
    [BLOCKS.OL_LIST]: (_, children) => <ol className="list-decimal pl-10">{children}</ol>,
    [BLOCKS.QUOTE]: (_, children) => (
      <blockquote className="-ml-6 border-l-4 border-blue-lighter p-2 pl-4 text-grey-darker">
        {children}
      </blockquote>
    ),
    [BLOCKS.HR]: () => <hr className="my-6 w-24 border-0 border-b-2 border-blue" />,
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const fields = node.data.target?.fields;
      if (typeof fields?.file?.url !== "string") return null;
      return (
        <img
          className="my-4 h-48 w-64 max-w-full rounded-lg object-cover shadow-lg"
          src={`${assetUrl(fields.file.url)}?w=512&fm=webp`}
          alt={fields.title ?? ""}
          loading="lazy"
        />
      );
    },
    [INLINES.HYPERLINK]: (node, children) => (
      <a className="text-blue underline" href={node.data.uri} target="_blank" rel="noreferrer">
        {children}
      </a>
    ),
    [INLINES.ASSET_HYPERLINK]: (node, children) => {
      const url = node.data.target?.fields?.file?.url;
      if (typeof url !== "string") return <>{children}</>;
      return (
        <a className="text-blue underline" href={assetUrl(url)} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    },
  },
};

export function RichText({ document }: { document: Document }) {
  return <>{documentToReactComponents(document, options)}</>;
}
