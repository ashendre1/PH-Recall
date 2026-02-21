// ── API Module ────────────────────────────────────────
// Sends scraped data to the Node.js backend, which handles
// embedding generation and MongoDB Atlas storage.

/**
 * Send scraped data to the backend server.
 * The backend generates embeddings and stores everything in MongoDB Atlas.
 *
 * @param {object} data - Scraped page data.
 * @param {string} data.url - The page URL.
 * @param {string} data.title - The page title.
 * @param {Array} data.headings - Array of heading objects.
 * @param {Array} data.paragraphs - Array of paragraph strings.
 * @param {string} data.fullText - Combined text content.
 * @param {string} backendUrl - The backend server URL.
 * @returns {Promise<object>} The backend response.
 */
async function sendToBackend(data, backendUrl) {
  const url = `${backendUrl.replace(/\/+$/, "")}/api/scrape`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errBody = await response.text();
    let message;
    try {
      message = JSON.parse(errBody).error || errBody;
    } catch {
      message = errBody;
    }
    throw new Error(`Backend error (${response.status}): ${message}`);
  }

  return response.json();
}

/**
 * Check if the backend server is reachable.
 *
 * @param {string} backendUrl - The backend server URL.
 * @returns {Promise<boolean>}
 */
async function checkBackendHealth(backendUrl) {
  try {
    const url = `${backendUrl.replace(/\/+$/, "")}/api/health`;
    const response = await fetch(url, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}
