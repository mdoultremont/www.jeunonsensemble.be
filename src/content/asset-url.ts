// Contentful serves asset URLs protocol-relative ("//images.ctfassets.net/...").
export function assetUrl(url: string) {
  return url.startsWith("//") ? `https:${url}` : url;
}
