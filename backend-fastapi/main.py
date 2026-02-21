# ── Recall FastAPI Backend ──────────────────────────
# Quiz generation service using Gemini and MongoDB.

import os
from datetime import datetime
from typing import Optional, List, Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.mongo import connect_db, get_db, close_db
from services.embedding import get_embedding
from services.similarity import find_top_paragraphs
from services.gemini import generate_quiz_questions

# Load environment variables
load_dotenv()

app = FastAPI(title="Recall Quiz API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class QuizGenerateRequest(BaseModel):
    topic: str
    numQuestions: Optional[int] = 5


class QuizQuestion(BaseModel):
    question: str
    idealAnswer: str
    paragraphIds: List[str]


class QuizGenerateResponse(BaseModel):
    questions: List[QuizQuestion]
    topic: str
    paragraphsUsed: List[Dict[str, Any]]


# Startup/Shutdown events
@app.on_event("startup")
async def startup_event():
    """Connect to MongoDB on startup."""
    try:
        connect_db()
        print("[startup] FastAPI server ready")
    except Exception as e:
        print(f"[startup] Failed to connect to MongoDB: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Close MongoDB connection on shutdown."""
    close_db()


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# Main quiz generation endpoint
@app.post("/quiz/generate", response_model=QuizGenerateResponse)
async def generate_quiz(request: QuizGenerateRequest):
    """
    Generate quiz questions based on a topic.
    
    Flow:
    1. Embed the topic
    2. Find top 3 similar paragraphs using cosine similarity
    3. Send paragraphs to Gemini to generate questions
    4. Store questions in MongoDB
    5. Return questions to frontend
    """
    try:
        # 1. Validate topic input
        topic = request.topic.strip()
        if not topic:
            raise HTTPException(status_code=400, detail="Topic cannot be empty")
        
        num_questions = request.numQuestions or 5
        if num_questions < 1 or num_questions > 20:
            raise HTTPException(
                status_code=400,
                detail="numQuestions must be between 1 and 20"
            )

        print(f"[quiz] Generating quiz for topic: {topic}")

        # 2. Generate topic embedding
        print("[quiz] Generating topic embedding...")
        topic_embedding = await get_embedding(topic)
        print(f"[quiz] Topic embedding generated ({len(topic_embedding)} dimensions)")

        # 3. Query MongoDB for paragraphs with embeddings
        db = get_db()
        
        # Get collection name from environment variable, default to "paragraphs"
        paragraphs_collection_name = os.getenv("MONGO_COLLECTION", "paragraphs")
        paragraphs_collection = db[paragraphs_collection_name]
        paragraphs_count = paragraphs_collection.count_documents({})
        
        if paragraphs_count == 0:
            # Fallback: query scraped_pages and extract paragraphs
            print(f"[quiz] No paragraphs found in '{paragraphs_collection_name}' collection, querying scraped_pages...")
            scraped_collection = db["scraped_pages"]
            documents = list(scraped_collection.find({}))
            
            # Extract paragraphs from documents
            paragraphs_with_embeddings = []
            for doc in documents:
                if "paragraphs" in doc and isinstance(doc["paragraphs"], list):
                    # If document has paragraph-level embeddings, use them
                    # Otherwise, we'll need to generate embeddings for each paragraph
                    for idx, para_text in enumerate(doc["paragraphs"]):
                        if para_text and len(para_text.strip()) > 10:
                            para_id = f"{doc.get('_id', 'unknown')}_{idx}"
                            paragraphs_with_embeddings.append({
                                "paragraph": para_text,  # Match database field name
                                "paragraphIndex": idx,  # Match database field name
                                "paragraphId": para_id,  # Keep for backward compatibility
                                "articleId": str(doc.get("_id", "")),
                                "url": doc.get("url", ""),
                                "title": doc.get("title", ""),
                                # Note: If paragraph embeddings don't exist, we'd need to generate them
                                # For now, assume teammate will store per-paragraph embeddings
                                "embedding": None  # Will be populated if available
                            })
        else:
            # Query paragraphs collection
            print(f"[quiz] Found {paragraphs_count} paragraphs in collection")
            paragraphs_cursor = paragraphs_collection.find({"embedding": {"$exists": True, "$ne": None}})
            paragraphs_with_embeddings = list(paragraphs_cursor)
        
        if not paragraphs_with_embeddings:
            raise HTTPException(
                status_code=404,
                detail="No paragraphs with embeddings found in database"
            )

        # Filter paragraphs that have embeddings
        paragraphs_with_embeddings = [
            p for p in paragraphs_with_embeddings
            if p.get("embedding") is not None
        ]

        if not paragraphs_with_embeddings:
            raise HTTPException(
                status_code=404,
                detail="No paragraphs with embeddings available for similarity search"
            )

        print(f"[quiz] Found {len(paragraphs_with_embeddings)} paragraphs with embeddings")
        
        # Log details about the matching embeddings
        for idx, para in enumerate(paragraphs_with_embeddings[:10]):  # Log first 10 to avoid spam
            para_id = str(para.get("paragraphIndex", para.get("_id", "unknown")))
            embedding_dim = len(para.get("embedding", [])) if para.get("embedding") else 0
            para_text_preview = (para.get("paragraph", "") or para.get("text", ""))[:100]
            print(f"[quiz] Embedding {idx + 1}: ID={para_id}, dims={embedding_dim}, preview='{para_text_preview}...'")
        
        if len(paragraphs_with_embeddings) > 10:
            print(f"[quiz] ... and {len(paragraphs_with_embeddings) - 10} more embeddings")

        # 4. Calculate cosine similarity, get top 3 paragraphs
        print("[quiz] Calculating cosine similarity...")
        top_paragraphs = find_top_paragraphs(
            topic_embedding,
            paragraphs_with_embeddings,
            top_k=3
        )

        if not top_paragraphs:
            raise HTTPException(
                status_code=404,
                detail="No similar paragraphs found"
            )

        print(f"[quiz] Found {len(top_paragraphs)} top paragraphs")

        # 5. Extract paragraph texts (support both "paragraph" and "text" for backward compatibility)
        paragraphs_text = "\n\n".join([
            para.get("paragraph") or para.get("text", "") for para in top_paragraphs
        ])

        # Collect paragraph IDs (use paragraphIndex if available, otherwise _id)
        paragraph_ids = [
            str(para.get("paragraphIndex", para.get("_id", "")))
            for para in top_paragraphs
        ]

        # 6. Call Gemini to generate questions
        print(f"[quiz] Generating {num_questions} questions with Gemini...")
        gemini_questions = await generate_quiz_questions(paragraphs_text, num_questions)
        print(f"[quiz] Generated {len(gemini_questions)} questions")

        # 7. Store each question in MongoDB
        quiz_collection = db["quiz_questions"]
        stored_questions = []

        for qa_pair in gemini_questions:
            question_doc = {
                "question": qa_pair["question"],
                "idealAnswer": qa_pair["idealAnswer"],
                "paragraphIds": paragraph_ids,
                "topic": topic,
                "createdAt": datetime.utcnow(),
            }
            result = quiz_collection.insert_one(question_doc)
            stored_questions.append({
                "question": qa_pair["question"],
                "idealAnswer": qa_pair["idealAnswer"],
                "paragraphIds": paragraph_ids,
            })

        print(f"[quiz] Stored {len(stored_questions)} questions in MongoDB")

        # 8. Return questions to frontend
        return QuizGenerateResponse(
            questions=stored_questions,
            topic=topic,
            paragraphsUsed=[
                {
                    "text": para.get("paragraph") or para.get("text", ""),
                    "paragraphId": str(para.get("paragraphIndex", para.get("paragraphId", para.get("_id", "")))),
                    "similarity": para.get("similarity", 0.0),
                }
                for para in top_paragraphs
            ],
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[quiz] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
