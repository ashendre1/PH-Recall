// ── Embedding Service ────────────────────────────────
// Generates 384-dim vector embeddings via Hugging Face Inference API.
// Model: sentence-transformers/all-MiniLM-L6-v2 (free tier eligible).

const HF_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";

/**
 * Generate a 384-dimensional vector embedding for the given text.
 *
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} 384-dim float array.
 */
async function getEmbedding(text) {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    throw new Error("HF_API_KEY is not set in .env — add your Hugging Face API key.");
  }

  // Truncate to ~8000 chars to stay within model token limits
  const truncated = text.length > 8000 ? text.slice(0, 8000) : text;

  const response = await fetch(HF_MODEL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: truncated,
      options: { wait_for_model: true },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Hugging Face API error (${response.status}): ${errBody}`);
  }

  const result = await response.json();

  // Handle different response shapes from the HF API:
  // 1. Nested array (token-level embeddings): [[v1], [v2], ...] → mean-pool
  // 2. Single vector wrapped: [[0.1, 0.2, ...]]
  // 3. Flat array: [0.1, 0.2, ...]

  if (Array.isArray(result) && Array.isArray(result[0])) {
    if (typeof result[0][0] === "number") {
      // Shape: [[0.1, 0.2, ...]] — single vector wrapped in outer array
      return result[0];
    }
    // Token-level embeddings: mean pool across tokens
    const numTokens = result.length;
    const dim = result[0].length;
    const pooled = new Array(dim).fill(0);
    for (let i = 0; i < numTokens; i++) {
      for (let j = 0; j < dim; j++) {
        pooled[j] += result[i][j];
      }
    }
    for (let j = 0; j < dim; j++) {
      pooled[j] /= numTokens;
    }
    return pooled;
  }

  if (Array.isArray(result) && typeof result[0] === "number") {
    return result;
  }

  throw new Error("Unexpected embedding response format from Hugging Face.");
}

module.exports = { getEmbedding };
