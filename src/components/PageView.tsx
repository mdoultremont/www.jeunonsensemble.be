import { bannerSources, imageUrl } from "../content/asset-url";
import { useSite } from "../content/use-site";
import type { Page } from "../content/site";
import { Navbar } from "./Navbar";
import { RichText } from "./RichText";

export function PageView({ page }: { page: Page }) {
  const site = useSite();
  return (
    <>
      {page.banner && (
        <img
          className="h-48 w-full object-cover object-center"
          alt=""
          src={imageUrl(page.banner.url, Math.min(page.banner.width ?? 2400, 2400))}
          srcSet={bannerSources(page.banner.url, page.banner.width)}
          sizes="100vw"
          width={page.banner.width}
          height={page.banner.height}
          loading="eager"
          fetchPriority="high"
        />
      )}
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto p-8">
        <div className="max-w-[68ch]">
          <h1 className="text-4xl font-medium">{page.title}</h1>
          {page.sections.map((section) => (
            <article key={section.slug}>
              <h2 id={section.slug} className="mt-12 scroll-mt-24 text-xl font-medium">
                <a href={`#${section.slug}`} className="text-blue-dark">
                  {section.title}
                </a>
              </h2>
              <div className="rich-text mt-6">
                <RichText document={section.content} site={site} page={page} />
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
