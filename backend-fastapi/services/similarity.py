# ── Similarity Service ────────────────────────────────
# Calculates cosine similarity between embeddings to find relevant paragraphs.

import numpy as np
from typing import List, Dict, Any


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculate cosine similarity between two vectors.

    Args:
        vec1: First vector
        vec2: Second vector

    Returns:
        Cosine similarity score between -1 and 1
    """
    vec1_np = np.array(vec1)
    vec2_np = np.array(vec2)
    
    dot_product = np.dot(vec1_np, vec2_np)
    norm1 = np.linalg.norm(vec1_np)
    norm2 = np.linalg.norm(vec2_np)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return float(dot_product / (norm1 * norm2))


def find_top_paragraphs(
    query_embedding: List[float],
    paragraphs: List[Dict[str, Any]],
    top_k: int = 3
) -> List[Dict[str, Any]]:
    """
    Find top K paragraphs most similar to the query embedding using cosine similarity.

    Args:
        query_embedding: The embedding vector for the query/topic
        paragraphs: List of paragraph documents with 'embedding' and 'text' fields
        top_k: Number of top paragraphs to return (default: 3)

    Returns:
        List of top K paragraphs with similarity scores, sorted by score (highest first)
        Each item contains: {text, embedding, paragraphId, similarity, ...}
    """
    if not paragraphs:
        return []

    # Calculate similarity for each paragraph
    scored_paragraphs = []
    for para in paragraphs:
        if "embedding" not in para or not para["embedding"]:
            continue
        
        similarity = cosine_similarity(query_embedding, para["embedding"])
        scored_para = para.copy()
        scored_para["similarity"] = similarity
        scored_paragraphs.append(scored_para)

    # Sort by similarity (descending) and return top K
    scored_paragraphs.sort(key=lambda x: x["similarity"], reverse=True)
    
    return scored_paragraphs[:top_k]
