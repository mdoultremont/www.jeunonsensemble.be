import { useSite } from "../content/use-site";
import { PageLink } from "./PageLink";

export function Footer() {
  const site = useSite();

  return (
    <footer className="bg-grey-lighter px-8 py-8 md:px-12">
      <div className="flex flex-wrap">
        {site.pages.map((page) => (
          <div key={page.slug} className="mb-8 w-full px-4 md:w-1/2 lg:w-1/3 xl:w-1/4">
            <PageLink page={page} className="text-lg/[1.15] font-medium">
              {page.title}
            </PageLink>
            {page.sections.map((section) => (
              <div key={section.slug} className="mt-4">
                <PageLink page={page} hash={section.slug}>
                  {section.title}
                </PageLink>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between border-t border-grey-light pt-6 text-sm/[1.15]">
        <div className="mt-2">
          {site.copyright} -{" "}
          <a href="https://app.contentful.com/spaces/v9fs1t81g1do/entries?contentTypeId=pages">
            Administration
          </a>
        </div>
        <a className="mt-2" href={`mailto:${site.email}`}>
          {site.email}
        </a>
      </div>
    </footer>
  );
}
