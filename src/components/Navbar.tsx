import { useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

import { useSite } from "../content/use-site";
import { Logo } from "./Logo";
import { PageLink } from "./PageLink";

function containTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const controls = event.currentTarget.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>(
    "a[href], button",
  );
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

export function Navbar() {
  const site = useSite();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const home = site.pages[0];

  const restoreScroll = useCallback(() => {
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => {
    dialog.current?.close();
    restoreScroll();
    setOpen(false);
  }, [restoreScroll]);

  useEffect(
    () =>
      router.subscribe("onResolved", ({ hrefChanged }) => {
        if (hrefChanged) closeMenu();
      }),
    [router, closeMenu],
  );

  useEffect(() => {
    const menu = dialog.current;
    const desktop = window.matchMedia("(min-width: 48rem)");
    const onResize = () => {
      if (desktop.matches) closeMenu();
    };
    desktop.addEventListener("change", onResize);
    return () => {
      desktop.removeEventListener("change", onResize);
      menu?.close();
      restoreScroll();
    };
  }, [closeMenu, restoreScroll]);

  function openMenu() {
    if (!dialog.current || dialog.current.open) return;
    previousOverflow.current = document.body.style.overflow;
    dialog.current.showModal();
    document.body.style.overflow = "hidden";
    setOpen(true);
  }

  return (
    <div className="sticky top-0 z-10 bg-nav text-nav-text">
      <nav
        aria-label="Navigation principale"
        className="hidden items-center justify-between px-8 py-4 md:flex"
      >
        <PageLink page={home} className="mr-4 flex shrink-0 items-center">
          <Logo />
          <span className="ml-4 text-lg">{site.name}</span>
        </PageLink>
        <div className="flex flex-wrap justify-end">
          {site.pages.map((page) => (
            <PageLink key={page.slug} page={page} className="p-2">
              {page.title}
            </PageLink>
          ))}
        </div>
      </nav>

      <nav
        aria-label="Navigation mobile"
        className="flex items-center justify-between px-8 py-2 md:hidden"
      >
        <PageLink
          page={home}
          aria-label={site.name}
          className="flex min-h-11 min-w-11 items-center"
        >
          <Logo className="size-10" />
        </PageLink>
        <button
          ref={opener}
          type="button"
          aria-label="Ouvrir le menu"
          aria-controls="mobile-menu"
          aria-expanded={open}
          onClick={openMenu}
          className="flex min-h-11 min-w-11 items-center justify-center"
        >
          <svg className="size-10" viewBox="0 0 34 24" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2 2C2 0.89543 2.89543 0 4 0H29C30.1046 0 31 0.89543 31 2C31 3.10457 30.1046 4 29 4H4C2.89543 4 2 3.10457 2 2ZM0 12C0 10.8954 0.89543 10 2 10H31.5C32.6046 10 33.5 10.8954 33.5 12C33.5 13.1046 32.6046 14 31.5 14H2C0.89543 14 0 13.1046 0 12ZM2 22C2 20.8954 2.89543 20 4 20H29C30.1046 20 31 20.8954 31 22C31 23.1046 30.1046 24 29 24H4C2.89543 24 2 23.1046 2 22Z"
            />
          </svg>
        </button>
      </nav>

      <dialog
        ref={dialog}
        id="mobile-menu"
        aria-label="Menu principal"
        className="mobile-menu"
        onKeyDown={containTab}
        onCancel={closeMenu}
        onClose={() => {
          restoreScroll();
          setOpen(false);
          if (!window.matchMedia("(min-width: 48rem)").matches) opener.current?.focus();
        }}
      >
        <div className="flex items-center justify-between">
          <Logo className="size-10 text-blue" />
          <button
            type="button"
            aria-label="Fermer le menu"
            autoFocus
            onClick={closeMenu}
            className="flex min-h-11 min-w-11 items-center justify-center"
          >
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
        <nav aria-label="Pages du site" className="mt-8">
          {site.pages.map((page) => (
            <PageLink
              key={page.slug}
              page={page}
              onClick={closeMenu}
              className="block min-h-11 p-4 text-right text-lg font-medium tracking-wide uppercase"
            >
              {page.title}
            </PageLink>
          ))}
        </nav>
      </dialog>
    </div>
  );
}
