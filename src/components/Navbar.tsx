import { useState } from "react";

import { useSite } from "../content/use-site";
import { Logo } from "./Logo";
import { PageLink } from "./PageLink";

export function Navbar() {
  const site = useSite();
  const [open, setOpen] = useState(false);
  const home = site.pages.find((page) => page.isHome)!;

  return (
    <div className="sticky top-0 z-10 bg-blue text-blue-lightest">
      <nav className="hidden items-center justify-between px-8 py-4 md:flex">
        <PageLink page={home} className="mr-4 flex shrink-0 items-center">
          <Logo />
          <span className="ml-4 text-lg/[1.15]">{site.name}</span>
        </PageLink>
        <div className="flex flex-wrap justify-end">
          {site.pages.map((page) => (
            <PageLink key={page.slug} page={page} className="p-2">
              {page.title}
            </PageLink>
          ))}
        </div>
      </nav>

      <nav className="flex items-center justify-between px-8 py-2 md:hidden">
        <PageLink page={home} aria-label={site.name}>
          <Logo className="size-10" />
        </PageLink>
        <button
          type="button"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <svg className="size-10" viewBox="0 0 34 24" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2 2C2 0.89543 2.89543 0 4 0H29C30.1046 0 31 0.89543 31 2C31 3.10457 30.1046 4 29 4H4C2.89543 4 2 3.10457 2 2ZM0 12C0 10.8954 0.89543 10 2 10H31.5C32.6046 10 33.5 10.8954 33.5 12C33.5 13.1046 32.6046 14 31.5 14H2C0.89543 14 0 13.1046 0 12ZM2 22C2 20.8954 2.89543 20 4 20H29C30.1046 20 31 20.8954 31 22C31 23.1046 30.1046 24 29 24H4C2.89543 24 2 23.1046 2 22Z"
            />
          </svg>
        </button>

        <div
          inert={!open}
          className={`fixed inset-0 border-t-8 border-blue bg-grey-lightest px-8 py-4 text-grey-darkest transition-[opacity,scale] duration-200 ease-out ${open ? "scale-100 opacity-100" : "invisible scale-0 opacity-0"}`}
        >
          <div className="flex items-center justify-between">
            <Logo className="size-10 text-blue" />
            <button type="button" aria-label="Fermer le menu" onClick={() => setOpen(false)}>
              <svg
                width="31"
                height="24"
                viewBox="0 0 31 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path d="M2 22L29 2M2 2L29 22" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="mt-16">
            {site.pages.map((page) => (
              <PageLink
                key={page.slug}
                page={page}
                onClick={() => setOpen(false)}
                className="block p-4 text-right text-lg/[1.15] font-medium tracking-wide uppercase"
              >
                {page.title}
              </PageLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
