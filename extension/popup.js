// ── Popup Logic ──────────────────────────────────────

const scrapeBtn = document.getElementById("scrapeBtn");
const statusEl  = document.getElementById("status");

const BACKEND_URL = "http://localhost:3001";

scrapeBtn.addEventListener("click", async () => {
  // Disable button and show spinner
  scrapeBtn.disabled = true;
  scrapeBtn.innerHTML = `<span class="spinner"></span> Scraping…`;
  showStatus("Extracting page content…", "loading");

  try {

    // 2. Inject content script to scrape the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const [{ result: scraped }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    if (!scraped || (!scraped.paragraphs.length && !scraped.headings.length)) {
      showStatus("No content found on this page.", "error");
      resetButton();
      return;
    }

    // 3. Update status
    scrapeBtn.innerHTML = `<span class="spinner"></span> Sending…`;
    showStatus("Generating embeddings & storing vectors…", "loading");

    // 4. Send scraped data to backend
    const response = await sendToBackend(scraped, BACKEND_URL);

    if (response.success) {
      showStatus("✓ Vector database successfully appended", "success");
    } else {
      showStatus(`Error: ${response.error}`, "error");
    }
  } catch (err) {
    showStatus(`Error: ${err.message}`, "error");
  } finally {
    resetButton();
  }
});

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.classList.remove("hidden");
}

function resetButton() {
  scrapeBtn.disabled = false;
  scrapeBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    Scrap Data
  `;
}
