# Incumbent design

Keep the Rubik typeface, blue identity, pale grey surfaces, simple sections, and full-width 12rem banner crop. French CMS content determines page structure and section titles.

Use the semantic `nav`, `nav-text`, and `link` tokens from `src/styles.css`. Navigation uses `#186faf` with white text. Body links use `#186faf` on `#f0f4f8`. Normal text and links need at least 4.5:1 contrast. Brand blue remains available for decoration.

Keep prose near 68ch with a 1.6 line height and light tracking. Scope paragraph, list, heading, and quotation spacing to `.rich-text`. Empty CMS paragraphs do not create spacers. Long links wrap within the viewport.

The mobile menu is a labeled native modal dialog. Keep focus inside it, support Escape, restore focus and scroll on close, and close on navigation or the desktop breakpoint. Links and controls need a 44px touch target. The full-screen menu scrolls on short screens.

Every page has a first-focus skip link, a focusable main target, and visible focus outlines. Add motion only under `prefers-reduced-motion: no-preference`. Keep reduced-motion navigation immediate. Banners are decorative, eager images. Embedded content images load lazily.
