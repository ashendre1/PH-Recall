// ── Options Page Logic ───────────────────────────────

const form = document.getElementById("settingsForm");
const saveStatus = document.getElementById("saveStatus");

const fields = ["backendUrl"];

// ── Load saved settings on page open ─────────────────
chrome.storage.sync.get(fields, (items) => {
  const backendUrlEl = document.getElementById("backendUrl");
  if (backendUrlEl && items.backendUrl) {
    backendUrlEl.value = items.backendUrl;
  }
});

// ── Save settings ────────────────────────────────────
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const backendUrlEl = document.getElementById("backendUrl");
  let backendUrl = backendUrlEl ? backendUrlEl.value.trim() : "";

  // Default to localhost if empty
  if (!backendUrl) backendUrl = "http://localhost:3001";

  // Remove trailing slash
  backendUrl = backendUrl.replace(/\/+$/, "");

  chrome.storage.sync.set({ backendUrl }, () => {
    showSaveStatus("✓ Settings saved!", false);
  });
});

function showSaveStatus(message, isError) {
  saveStatus.textContent = message;
  saveStatus.className = `status ${isError ? "error" : "success"}`;
  setTimeout(() => (saveStatus.className = "status"), 3000);
}
