import { expect, test } from "@playwright/test";

function luminance(color: string) {
  const values = color
    .match(/[\d.]+/g)!
    .slice(0, 3)
    .map(Number)
    .map((value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
  return values[0]! * 0.2126 + values[1]! * 0.7152 + values[2]! * 0.0722;
}
function contrast(foreground: string, background: string) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function openMenu(page: import("@playwright/test").Page) {
  await page.goto("/");
  const opener = page.getByRole("button", { name: "Ouvrir le menu", includeHidden: true });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Menu principal" });
  await expect(dialog).toBeVisible();
  return { opener, dialog };
}

test("mobile menu contains keyboard focus, Escape restores focus and scroll", async ({ page }) => {
  const { opener, dialog } = await openMenu(page);
  const close = dialog.getByRole("button", { name: "Fermer le menu" });
  await expect(close).toBeFocused();
  await expect(opener).toHaveAttribute("aria-expanded", "true");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link").last()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  for (let index = 0; index < 10; index++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page
    .locator("main a")
    .first()
    .evaluate((element: HTMLElement) => element.focus());
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(opener).toHaveAttribute("aria-expanded", "false");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("menu navigation and close control restore scroll, desktop transition closes it", async ({
  page,
}) => {
  const { opener, dialog } = await openMenu(page);
  await dialog.getByRole("button", { name: "Fermer le menu" }).click();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await opener.click();
  await dialog.getByRole("link", { name: "Programme", exact: true }).click();
  await expect(page).toHaveURL(/\/programme$/);
  await expect(dialog).not.toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await opener.click();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(dialog).not.toBeVisible();
  await expect(opener).toHaveAttribute("aria-expanded", "false");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("short landscape menu scrolls to its last 44px link", async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 375 });
  const { dialog } = await openMenu(page);
  expect(await dialog.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
    true,
  );
  const last = dialog.getByRole("link").last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
  const rect = await last.boundingBox();
  expect(rect?.height).toBeGreaterThanOrEqual(44);
  await last.click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(dialog).not.toBeVisible();
});

test("skip link is first focus target on content and true 404 pages", async ({ page }) => {
  for (const url of ["/", "/programme", "/missing/nested-page"]) {
    const response = await page.goto(url);
    expect(response?.status()).toBe(url.includes("missing") ? 404 : 200);
    if (url.includes("missing")) {
      await expect(page).toHaveTitle(/Page introuvable/);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    }
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Aller au contenu" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
    expect(
      await page.locator("main").evaluate((element) => getComputedStyle(element).outlineStyle),
    ).toBe("solid");
  }
});

test("static navigation uses local assets, head metadata is specific, and 404 has noindex", async ({
  page,
}) => {
  const remote: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4173")) remote.push(request.url());
  });
  await page.goto("/");
  await expect(page).toHaveTitle("Accueil · Jeûnons Ensemble");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://jeunonsensemble.be/",
  );
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).toContain("Ce contenu fictif");
  expect(description).not.toContain("Auteur");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  await expect(page.locator('meta[name="content-source"]')).toHaveAttribute("content", "fixture");
  await page.locator("footer").getByRole("link", { name: "Programme", exact: true }).click();
  await expect(page).toHaveTitle("Programme · Jeûnons Ensemble");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://jeunonsensemble.be/programme",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  expect(remote).toEqual([]);
  const response = await page.goto("/unknown-page");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(/Page introuvable/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test("banner stays cropped, prose wraps, and actual color pairs meet AA", async ({ page }) => {
  await page.goto("/");
  for (const width of [320, 375, 667, 1280]) {
    await page.setViewportSize({ width, height: 812 });
    const banner = page.locator('img[fetchpriority="high"]');
    await expect(banner).toHaveAttribute("alt", "");
    await expect(banner).toHaveAttribute("sizes", "100vw");
    await expect(banner).toHaveAttribute("loading", "eager");
    const rect = await banner.boundingBox();
    expect(rect?.width).toBe(width);
    expect(rect?.height).toBe(192);
    const dimensions = await banner.evaluate((element) => ({
      width: element.getAttribute("width"),
      height: element.getAttribute("height"),
      fit: getComputedStyle(element).objectFit,
    }));
    expect(dimensions).toEqual({ width: "1145", height: "599", fit: "cover" });
    await page
      .locator(".rich-text p")
      .first()
      .evaluate((element) => element.append(" https://example.com/" + "long".repeat(70)));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  const colors = await page.evaluate(() => {
    const nav = document.querySelector(".bg-nav")!;
    const link = document.querySelector(".rich-text a")!;
    return {
      nav: getComputedStyle(nav).color,
      navBackground: getComputedStyle(nav).backgroundColor,
      link: getComputedStyle(link).color,
      background: getComputedStyle(document.body).backgroundColor,
    };
  });
  expect(contrast(colors.nav, colors.navBackground)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(colors.link, colors.background)).toBeGreaterThanOrEqual(4.5);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
    "auto",
  );
});

test("closing the modal preserves an existing body overflow style", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    document.body.style.overflow = "auto";
  });
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("auto");
});

test("rich text entry links, section ownership and same-site URLs navigate without reloading", async ({
  page,
}) => {
  await page.goto("/");
  const prose = page.locator(".rich-text");
  await expect(prose.getByRole("link", { name: "Programme lié", exact: true })).toHaveAttribute(
    "href",
    "/programme",
  );
  await expect(prose.getByRole("link", { name: "Section du programme" })).toHaveAttribute(
    "href",
    "/programme#section-1",
  );
  await expect(prose.getByText("Contenu indisponible", { exact: true })).toHaveCount(1);
  await expect(prose.getByText("Entrée sans destination", { exact: true })).toHaveCount(1);
  await expect(prose.locator('a[target="_blank"]')).toHaveCount(0);
  await expect(prose.getByRole("link", { name: "Lien externe" })).toHaveAttribute(
    "href",
    "https://example.com/document",
  );
  await expect(prose.getByText(/type: .*id:/)).toHaveCount(0);
  await page.evaluate(() => {
    document.documentElement.dataset.navigation = "retained";
  });
  await prose.getByRole("link", { name: "Programme absolu" }).click();
  await expect(page).toHaveURL(/\/programme\?origine=test#section-1$/);
  expect(await page.evaluate(() => document.documentElement.dataset.navigation)).toBe("retained");
  await expect(
    page.locator(".rich-text").getByRole("link", { name: "Partage local" }),
  ).toHaveAttribute("href", "/programme#partage");
  await page.locator(".rich-text").getByRole("link", { name: "Partage local" }).click();
  await expect(page).toHaveURL(/\/programme#partage$/);
});

test("footer section current location matches both page and hash", async ({ page }) => {
  await page.goto("/programme");
  const footer = page.locator("footer");
  await expect(footer.locator('a[href*="#"][aria-current]')).toHaveCount(0);
  const section = footer.locator('a[href="/programme#section-1"]');
  await section.click();
  await expect(section).toHaveAttribute("aria-current", "location");
  await expect(footer.locator('a[href*="#"][aria-current]')).toHaveCount(1);
  const shared = footer.locator('a[href="/programme#partage"]');
  await shared.click();
  await expect(shared).toHaveAttribute("aria-current", "location");
  await expect(section).not.toHaveAttribute("aria-current");
  await expect(footer.locator('a[href*="#"][aria-current]')).toHaveCount(1);
});

test("Back and Forward between pages and sections close the menu and restore scroll", async ({
  page,
}) => {
  await page.goto("/programme");
  await page
    .locator("footer")
    .getByRole("link", { name: "Jeûner, pourquoi ?", exact: true })
    .click();
  const opener = page.getByRole("button", { name: "Ouvrir le menu" });
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/programme$/);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await opener.click();
  await page.goForward();
  await expect(page).toHaveURL(/\/pourquoi$/);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await page.locator("main h2 a").first().click();
  await expect(page).toHaveURL(/\/pourquoi#section-2$/);
  await opener.click();
  await page.goBack();
  await expect(page).toHaveURL(/\/pourquoi$/);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await opener.click();
  await page.goForward();
  await expect(page).toHaveURL(/\/pourquoi#section-2$/);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("flat and nested static 404 pages hydrate without page errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const url of ["/404", "/missing-page", "/missing/nested-page"]) {
    const response = await page.goto(url);
    expect(response?.status()).toBe(url === "/404" ? 200 : 404);
    await expect(page).toHaveTitle(/Page introuvable/);
    await page.getByRole("link", { name: "Retour à l’accueil" }).click();
    await expect(page).toHaveURL(/\/$/);
  }
  expect(errors).toEqual([]);
});
