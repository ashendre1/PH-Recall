// ── Content Script ────────────────────────────────────
// Injected into the active tab to scrape headings & paragraphs.
// Returns a structured object back to the caller via the script result.

(function () {
  const headings = [];
  const paragraphs = [];

  // Collect all heading elements (h1–h6)
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el) => {
    const text = el.innerText.trim();
    if (text) {
      headings.push({
        tag: el.tagName.toLowerCase(),
        text: text,
      });
    }
  });

  // Collect all paragraph elements
  document.querySelectorAll("p").forEach((el) => {
    const text = el.innerText.trim();
    if (text && text.length > 10) {
      paragraphs.push(text);
    }
  });

  // Deduplicate paragraphs
  const uniqueParagraphs = [...new Set(paragraphs)];

  // Build full text from headings + paragraphs for embedding
  const headingTexts = headings.map((h) => h.text);
  const allTexts = [...headingTexts, ...uniqueParagraphs];
  const fullText = allTexts.join("\n\n");

  // Return structured data
  return {
    url: window.location.href,
    title: document.title || "",
    headings: headings,
    paragraphs: uniqueParagraphs,
    fullText: fullText,
  };
})();
