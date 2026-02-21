# ── Gemini Service ────────────────────────────────
# Generates quiz questions using Google Gemini API.

import os
import json
import asyncio
import google.generativeai as genai
from typing import List, Dict


def initialize_gemini():
    """
    Initialize Gemini client with API key from environment.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in .env — add your Gemini API key.")
    
    genai.configure(api_key=api_key)
    
    # Get model name from env, with fallbacks for older API versions
    model_name = os.getenv("GEMINI_MODEL")
    
    # If no model specified, try to find a working one
    if not model_name:
        # Try newer models first, then fall back to older ones
        models_to_try = ["gemini-3-flash"]
    else:
        models_to_try = [model_name]
    
    # Try each model until one works
    last_error = None
    for model in models_to_try:
        try:
            print(f"[gemini] Attempting to use model: {model}")
            return genai.GenerativeModel(model)
        except Exception as e:
            last_error = e
            print(f"[gemini] Model '{model}' failed: {e}")
            continue
    
    # If all models failed, list available models for debugging
    print("[gemini] All models failed. Listing available models...")
    try:
        available = []
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                available.append(model.name)
                print(f"[gemini] Available: {model.name}")
        if available:
            print(f"[gemini] Try setting GEMINI_MODEL to one of: {available[0]}")
    except Exception as list_error:
        print(f"[gemini] Could not list models: {list_error}")
    
    raise RuntimeError(f"Could not initialize any Gemini model. Last error: {last_error}")


async def generate_quiz_questions(
    paragraphs_text: str,
    num_questions: int = 5
) -> List[Dict[str, str]]:
    """
    Generate quiz questions with ideal answers based on provided paragraphs.

    Args:
        paragraphs_text: The text content from relevant paragraphs
        num_questions: Number of questions to generate (default: 5)

    Returns:
        List of dictionaries with 'question' and 'idealAnswer' keys
    """
    model = initialize_gemini()
    
    prompt = f"""Generate {num_questions} quiz questions with ideal answers based on these paragraphs:

{paragraphs_text}

Return your response as a JSON array in this exact format:
[
  {{"question": "Question text here", "idealAnswer": "Answer text here"}},
  {{"question": "Question text here", "idealAnswer": "Answer text here"}}
]

Make sure the questions are relevant to the content and test understanding. Return ONLY the JSON array, no other text."""

    try:
        # Run the blocking Gemini call in a thread pool
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt)
        )
        response_text = response.text.strip()
        
        # Clean up response text (remove markdown code blocks if present)
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse JSON response
        questions = json.loads(response_text)
        
        # Validate structure
        if not isinstance(questions, list):
            raise ValueError("Gemini response is not a list")
        
        for q in questions:
            if not isinstance(q, dict) or "question" not in q or "idealAnswer" not in q:
                raise ValueError("Invalid question format in Gemini response")
        
        return questions
        
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Gemini JSON response: {e}. Response: {response_text}")
    except Exception as e:
        raise RuntimeError(f"Gemini API error: {str(e)}")
