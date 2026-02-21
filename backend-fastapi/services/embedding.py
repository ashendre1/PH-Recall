# ── Embedding Service ────────────────────────────────
# Generates 384-dim vector embeddings via Hugging Face Inference API.
# Model: sentence-transformers/all-MiniLM-L6-v2 (free tier eligible).

import os
import httpx
from typing import List

HF_MODEL_URL = (
    "https://router.huggingface.co/hf-inference/models/"
    "sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
)


async def get_embedding(text: str) -> List[float]:
    """
    Generate a 384-dimensional vector embedding for the given text.

    Args:
        text: The text to embed.

    Returns:
        384-dim float array.
    """
    api_key = os.getenv("HF_API_KEY")
    if not api_key:
        raise ValueError("HF_API_KEY is not set in .env — add your Hugging Face API key.")

    # Truncate to ~8000 chars to stay within model token limits
    truncated = text[:8000] if len(text) > 8000 else text

    async with httpx.AsyncClient() as client:
        response = await client.post(
            HF_MODEL_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "inputs": truncated,
                "options": {"wait_for_model": True},
            },
            timeout=30.0,
        )

        if not response.is_success:
            raise RuntimeError(
                f"Hugging Face API error ({response.status_code}): {response.text}"
            )

        result = response.json()

    # Handle different response shapes from the HF API:
    # 1. Nested array (token-level embeddings): [[v1], [v2], ...] → mean-pool
    # 2. Single vector wrapped: [[0.1, 0.2, ...]]
    # 3. Flat array: [0.1, 0.2, ...]

    if isinstance(result, list) and len(result) > 0:
        if isinstance(result[0], list):
            if len(result[0]) > 0 and isinstance(result[0][0], (int, float)):
                # Shape: [[0.1, 0.2, ...]] — single vector wrapped in outer array
                return result[0]
            # Token-level embeddings: mean pool across tokens
            num_tokens = len(result)
            dim = len(result[0])
            pooled = [0.0] * dim
            for token_embedding in result:
                for j in range(dim):
                    pooled[j] += token_embedding[j]
            for j in range(dim):
                pooled[j] /= num_tokens
            return pooled

        if isinstance(result[0], (int, float)):
            return result

    raise RuntimeError("Unexpected embedding response format from Hugging Face.")
