// Contentful also returns protocol-relative URLs.
export function assetUrl(url: string) {
  return url.startsWith("//") ? `https:${url}` : url;
}

export function imageUrl(url: string, width: number) {
  const normalized = assetUrl(url);
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return normalized;
  }
  if (!["images.ctfassets.net", "images.contentful.com"].includes(parsed.hostname))
    return normalized;
  parsed.searchParams.set("w", String(width));
  parsed.searchParams.set("fm", "webp");
  parsed.searchParams.set("q", "80");
  return parsed.href;
}

export function bannerSources(url: string, nativeWidth?: number) {
  if (imageUrl(url, 384) === assetUrl(url)) return undefined;
  const widths = [384, 640, 960, 1280, 1920, 2400].filter(
    (width) => !nativeWidth || width < nativeWidth,
  );
  if (nativeWidth) widths.push(Math.min(nativeWidth, 2400));
  return [...new Set(widths)].map((width) => `${imageUrl(url, width)} ${width}w`).join(", ");
}
