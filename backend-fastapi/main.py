# ── Recall FastAPI Backend ──────────────────────────
# Quiz generation service using Gemini and MongoDB.

import os
from datetime import datetime
from typing import Optional, List, Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.mongo import connect_db, get_db, close_db
from services.embedding import get_embedding
from services.similarity import find_top_paragraphs
from services.gemini import (
    generate_quiz_questions,
    generate_quiz_feedback,
    generate_text_quiz_questions,
    generate_audio_quiz_question,
    evaluate_audio_answer,
)
from services.elevenlabs import transcribe_audio_with_timestamps

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
    quizType: str = "text"  # "text" or "audio"
    numQuestions: Optional[int] = 5


class QuizQuestion(BaseModel):
    question: str
    questionType: str  # "mcq", "true_false", or "elaborate"
    options: List[str]  # 4 options for MCQ, 2 for True/False, empty for elaborate
    correctAnswer: int  # Index of correct option (0-3 for MCQ, 0-1 for True/False, -1 for elaborate)
    paragraphIds: List[str]


class QuizGenerateResponse(BaseModel):
    questions: List[QuizQuestion]
    topic: str
    paragraphsUsed: List[Dict[str, Any]]


class QuizAnswerItem(BaseModel):
    questionId: str
    question: str
    options: List[str]
    correctAnswer: int
    selectedAnswer: int


class QuizScoreRequest(BaseModel):
    answers: List[QuizAnswerItem]


class QuizScoreResult(BaseModel):
    questionId: str
    score: int  # 1 or 0
    feedback: str


class QuizScoreResponse(BaseModel):
    results: List[QuizScoreResult]
    totalScore: int
    totalQuestions: int


# Audio quiz scoring models
class AudioQuizScoreRequest(BaseModel):
    question: str
    topic: str
    paragraphIds: List[str]
    # Audio will be sent as multipart/form-data, not JSON


class AudioQuizScoreResponse(BaseModel):
    score: float  # 0.0 to 1.0 (articulateness score from Gemini)
    transcribedText: str
    isHesitant: bool
    elevenLabsFeedback: str  # Feedback about hesitancy/fluency
    geminiFeedback: str  # Feedback about articulateness
    audioFeedbackUrl: Optional[str] = None  # Placeholder for Eleven Labs TTS integration


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
        
        quiz_type = request.quizType or "text"
        if quiz_type not in ["text", "audio"]:
            raise HTTPException(
                status_code=400,
                detail="quizType must be 'text' or 'audio'"
            )
        
        num_questions = request.numQuestions or 5
        if quiz_type == "text" and (num_questions < 1 or num_questions > 20):
            raise HTTPException(
                status_code=400,
                detail="numQuestions must be between 1 and 20 for text quiz"
            )
        if quiz_type == "audio":
            num_questions = 1  # Audio quiz always has 1 question

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

        # 6. Call Gemini to generate questions based on quiz type
        if quiz_type == "text":
            print(f"[quiz] Generating {num_questions} text quiz questions (3 MCQ + 2 True/False) with Gemini...")
            gemini_questions = await generate_text_quiz_questions(paragraphs_text)
        else:  # audio
            print(f"[quiz] Generating 1 audio quiz question (elaborate) with Gemini...")
            gemini_questions = await generate_audio_quiz_question(paragraphs_text)
        print(f"[quiz] Generated {len(gemini_questions)} questions")

        # 7. Store each question in MongoDB
        quiz_collection = db["quiz_questions"]
        stored_questions = []

        for q in gemini_questions:
            question_doc = {
                "question": q["question"],
                "questionType": q.get("questionType", "mcq"),
                "options": q["options"],
                "correctAnswer": q["correctAnswer"],
                "paragraphIds": paragraph_ids,
                "topic": topic,
                "quizType": quiz_type,
                "createdAt": datetime.utcnow(),
            }
            result = quiz_collection.insert_one(question_doc)
            stored_questions.append({
                "question": q["question"],
                "questionType": q.get("questionType", "mcq"),
                "options": q["options"],
                "correctAnswer": q["correctAnswer"],
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


# Quiz scoring endpoint
@app.post("/quiz/score", response_model=QuizScoreResponse)
async def score_quiz(request: QuizScoreRequest):
    """
    Score quiz answers with automatic scoring and Gemini-generated feedback.
    
    Flow:
    1. Auto-score each answer (1 if correct, 0 if wrong)
    2. Generate feedback for each answer using Gemini
    3. Return scores and feedback
    """
    try:
        if not request.answers:
            raise HTTPException(status_code=400, detail="No answers provided")
        
        results = []
        total_score = 0
        
        print(f"[score] Scoring {len(request.answers)} answers...")
        
        for answer_item in request.answers:
            # Auto-score: 1 if correct, 0 if wrong
            is_correct = answer_item.selectedAnswer == answer_item.correctAnswer
            score = 1 if is_correct else 0
            total_score += score
            
            # Generate feedback using Gemini
            print(f"[score] Generating feedback for question: {answer_item.questionId}")
            try:
                feedback = await generate_quiz_feedback(
                    question=answer_item.question,
                    options=answer_item.options,
                    correct_answer=answer_item.correctAnswer,
                    user_answer=answer_item.selectedAnswer
                )
            except Exception as e:
                print(f"[score] Error generating feedback: {e}")
                # Fallback feedback
                if is_correct:
                    feedback = "Correct! Well done."
                else:
                    correct_option = answer_item.options[answer_item.correctAnswer] if answer_item.correctAnswer < len(answer_item.options) else "N/A"
                    feedback = f"Incorrect. The correct answer is: {correct_option}"
            
            results.append(QuizScoreResult(
                questionId=answer_item.questionId,
                score=score,
                feedback=feedback
            ))
        
        print(f"[score] Scoring complete. Total score: {total_score}/{len(request.answers)}")
        
        return QuizScoreResponse(
            results=results,
            totalScore=total_score,
            totalQuestions=len(request.answers)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[score] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# Audio quiz scoring endpoint
@app.post("/quiz/score-audio", response_model=AudioQuizScoreResponse)
async def score_audio_quiz(
    audio: UploadFile = File(...),
    question: str = Form(...),
    topic: str = Form(...),
    paragraphIds: str = Form(default="[]")  # JSON string array
):
    """
    Score audio quiz answer using Eleven Labs STT and Gemini evaluation.
    
    Flow:
    1. Use Eleven Labs Speech-to-Text to transcribe audio with word timestamps
    2. Calculate gaps between words to detect hesitancy (gaps > 3 seconds)
    3. Use Gemini to evaluate articulateness of the transcribed answer
    4. Return both Eleven Labs feedback (hesitancy) and Gemini feedback (articulateness)
    """
    try:
        print(f"[score-audio] Processing audio answer for topic: {topic}")
        
        # Read audio file
        audio_data = await audio.read()
        if not audio_data:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        # Get file extension for format detection
        # Handle webm format from MediaRecorder
        audio_format = audio.filename.split(".")[-1] if "." in audio.filename else "webm"
        # Map common formats
        if audio_format in ["webm", "ogg"]:
            audio_format = "webm"
        elif audio_format in ["mp3", "mpeg"]:
            audio_format = "mp3"
        elif audio_format in ["wav", "wave"]:
            audio_format = "wav"
        
        # Step 1: Transcribe audio with Eleven Labs STT (with word timestamps)
        print("[score-audio] Transcribing audio with Eleven Labs STT...")
        try:
            transcription_result = await transcribe_audio_with_timestamps(
                audio_data=audio_data,
                audio_format=audio_format
            )
            transcribed_text = transcription_result["text"]
            is_hesitant = transcription_result["is_hesitant"]
            hesitancy_feedback = transcription_result["hesitancy_feedback"]
            
            print(f"[score-audio] Transcription complete. Text: {transcribed_text[:100]}...")
            print(f"[score-audio] Hesitancy detected: {is_hesitant}")
            
        except Exception as e:
            print(f"[score-audio] Error transcribing audio: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to transcribe audio: {str(e)}"
            )
        
        if not transcribed_text or not transcribed_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No speech detected in audio. Please try again."
            )
        
        # Step 2: Evaluate articulateness with Gemini
        print("[score-audio] Evaluating articulateness with Gemini...")
        try:
            gemini_evaluation = await evaluate_audio_answer(
                question=question,
                transcribed_answer=transcribed_text,
                topic=topic
            )
            gemini_feedback = gemini_evaluation.get("feedback", "Evaluation pending.")
            
            print(f"[score-audio] Gemini evaluation complete.")
            
        except Exception as e:
            print(f"[score-audio] Error evaluating with Gemini: {e}")
            # Fallback
            gemini_feedback = "Answer received. Full evaluation pending implementation."
        
        # Step 3: Generate audio feedback (TTS) - placeholder for future
        audio_feedback_url = None
        try:
            from services.elevenlabs import generate_audio_feedback
            # Combine both feedbacks for audio
            combined_feedback = f"{hesitancy_feedback}\n\n{gemini_feedback}"
            audio_feedback_url = await generate_audio_feedback(combined_feedback)
        except Exception as e:
            print(f"[score-audio] Audio feedback generation not yet implemented: {e}")
            audio_feedback_url = None
        
        print(f"[score-audio] Evaluation complete.")
        
        return AudioQuizScoreResponse(
            score=0.0,  # Not used anymore, kept for backward compatibility
            transcribedText=transcribed_text,
            isHesitant=is_hesitant,
            elevenLabsFeedback=hesitancy_feedback,
            geminiFeedback=gemini_feedback,
            audioFeedbackUrl=audio_feedback_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[score-audio] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
