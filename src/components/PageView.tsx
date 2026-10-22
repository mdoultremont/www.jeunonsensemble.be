import type { Page } from "../content/site";
import { Navbar } from "./Navbar";
import { RichText } from "./RichText";

export function PageView({ page }: { page: Page }) {
  return (
    <>
      {page.banner && (
        <div
          className="h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${page.banner.url}?w=2400&fm=webp&q=80)` }}
        />
      )}
      <Navbar />
      <main className="container mx-auto p-8">
        <div className="max-w-240">
          <h1 className="text-4xl/[1.15] font-medium">{page.title}</h1>
          {page.sections.map((section) => (
            <article key={section.slug}>
              <h2 id={section.slug} className="mt-12 scroll-mt-24 text-xl/[1.15] font-medium">
                <a href={`#${section.slug}`} className="text-blue-dark">
                  {section.title}
                </a>
              </h2>
              <div className="mt-6 leading-normal tracking-[0.05em]">
                <RichText document={section.content} />
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
