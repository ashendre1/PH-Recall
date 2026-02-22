# ── Gemini Service ────────────────────────────────
# Generates quiz questions using Google Gemini API.

import os
import json
import asyncio
import google.generativeai as genai
from typing import List, Dict, Any


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
) -> List[Dict[str, Any]]:
    """
    Generate MCQ quiz questions based on provided paragraphs.

    Args:
        paragraphs_text: The text content from relevant paragraphs
        num_questions: Number of questions to generate (default: 5)

    Returns:
        List of dictionaries with 'question', 'options', and 'correctAnswer' keys
        - question: str - The question text
        - options: List[str] - Array of 4 option strings
        - correctAnswer: int - Index (0-3) of the correct option
    """
    model = initialize_gemini()
    
    prompt = f"""Generate {num_questions} multiple choice quiz questions (MCQ) based on these paragraphs:

{paragraphs_text}

For each question, create exactly 4 options where one is clearly correct and the others are plausible but incorrect.

Return your response as a JSON array in this exact format:
[
  {{
    "question": "Question text here",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": 0
  }},
  {{
    "question": "Question text here",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": 2
  }}
]

Important:
- Each question must have exactly 4 options
- correctAnswer must be an integer index (0, 1, 2, or 3) indicating which option is correct
- Make sure the questions are relevant to the content and test understanding
- The incorrect options should be plausible but clearly wrong

Return ONLY the JSON array, no other text."""

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
            if not isinstance(q, dict):
                raise ValueError("Invalid question format in Gemini response")
            if "question" not in q or "options" not in q or "correctAnswer" not in q:
                raise ValueError("Question missing required fields: question, options, or correctAnswer")
            if not isinstance(q["options"], list) or len(q["options"]) != 4:
                raise ValueError("Each question must have exactly 4 options")
            if not isinstance(q["correctAnswer"], int) or q["correctAnswer"] < 0 or q["correctAnswer"] > 3:
                raise ValueError("correctAnswer must be an integer between 0 and 3")
        
        return questions
        
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Gemini JSON response: {e}. Response: {response_text}")
    except Exception as e:
        raise RuntimeError(f"Gemini API error: {str(e)}")


async def generate_quiz_feedback(
    question: str,
    options: List[str],
    correct_answer: int,
    user_answer: int
) -> str:
    """
    Generate feedback for a quiz answer using Gemini.

    Args:
        question: The question text
        options: List of 4 option strings
        correct_answer: Index (0-3) of the correct answer
        user_answer: Index (0-3) of the user's selected answer

    Returns:
        Feedback text explaining why the answer was correct or incorrect
    """
    model = initialize_gemini()
    
    is_correct = user_answer == correct_answer
    user_option = options[user_answer] if 0 <= user_answer < len(options) else "Invalid"
    correct_option = options[correct_answer] if 0 <= correct_answer < len(options) else "Invalid"
    
    prompt = f"""A student answered a multiple choice question. Provide constructive feedback.

Question: {question}

Options:
A) {options[0] if len(options) > 0 else "N/A"}
B) {options[1] if len(options) > 1 else "N/A"}
C) {options[2] if len(options) > 2 else "N/A"}
D) {options[3] if len(options) > 3 else "N/A"}

Correct answer: {correct_option} (Option {chr(65 + correct_answer) if 0 <= correct_answer < 4 else "?"})
Student's answer: {user_option} (Option {chr(65 + user_answer) if 0 <= user_answer < 4 else "?"})

The student's answer is {"CORRECT" if is_correct else "INCORRECT"}.

Provide brief, constructive feedback (2-3 sentences):
- If correct: Briefly affirm why this answer is right
- If incorrect: Explain why the selected answer is wrong and hint at why the correct answer is right

Keep it concise and educational. Return ONLY the feedback text, no labels or prefixes."""

    try:
        # Run the blocking Gemini call in a thread pool
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt)
        )
        feedback = response.text.strip()
        
        # Clean up any markdown formatting if present
        if feedback.startswith("```"):
            feedback = feedback.split("```")[1]
            if feedback.startswith("text"):
                feedback = feedback[4:]
        feedback = feedback.strip()
        
        return feedback
        
    except Exception as e:
        # Fallback feedback if Gemini fails
        if is_correct:
            return "Correct! Well done."
        else:
            return f"Incorrect. The correct answer is: {correct_option}"


async def generate_text_quiz_questions(
    paragraphs_text: str
) -> List[Dict[str, Any]]:
    """
    Generate text quiz questions: 3 MCQ + 2 True/False based on provided paragraphs.

    Args:
        paragraphs_text: The text content from relevant paragraphs

    Returns:
        List of dictionaries with 'question', 'questionType', 'options', and 'correctAnswer' keys
        - question: str - The question text
        - questionType: str - "mcq" or "true_false"
        - options: List[str] - Array of 4 options for MCQ, 2 for True/False
        - correctAnswer: int - Index of correct option
    """
    model = initialize_gemini()
    
    prompt = f"""Generate exactly 5 quiz questions based on these paragraphs:
{paragraphs_text}

Requirements:
- Generate exactly 3 multiple choice questions (MCQ) with 4 options each
- Generate exactly 2 True/False questions with 2 options ["True", "False"]
- Questions should test understanding of the content
- For MCQ: one option is clearly correct, others are plausible but incorrect
- For True/False: make statements that are clearly true or false based on the content

Return your response as a JSON array in this exact format:
[
  {{
    "question": "MCQ question text here",
    "questionType": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }},
  {{
    "question": "MCQ question text here",
    "questionType": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 2
  }},
  {{
    "question": "MCQ question text here",
    "questionType": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 1
  }},
  {{
    "question": "True/False statement here",
    "questionType": "true_false",
    "options": ["True", "False"],
    "correctAnswer": 0
  }},
  {{
    "question": "True/False statement here",
    "questionType": "true_false",
    "options": ["True", "False"],
    "correctAnswer": 1
  }}
]

Important:
- First 3 questions must be MCQ with exactly 4 options
- Last 2 questions must be True/False with exactly 2 options ["True", "False"]
- correctAnswer for MCQ: integer 0-3
- correctAnswer for True/False: 0 for True, 1 for False
- Make questions relevant and test understanding

Return ONLY the JSON array, no other text."""

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt)
        )
        response_text = response.text.strip()
        
        # Clean up response text
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
        if len(questions) != 5:
            raise ValueError(f"Expected 5 questions, got {len(questions)}")
        
        for idx, q in enumerate(questions):
            if not isinstance(q, dict):
                raise ValueError(f"Invalid question format at index {idx}")
            if "question" not in q or "questionType" not in q or "options" not in q or "correctAnswer" not in q:
                raise ValueError(f"Question {idx} missing required fields")
            
            q_type = q["questionType"]
            if q_type == "mcq":
                if idx >= 3:
                    raise ValueError(f"MCQ question found at position {idx}, but only first 3 should be MCQ")
                if not isinstance(q["options"], list) or len(q["options"]) != 4:
                    raise ValueError(f"MCQ question {idx} must have exactly 4 options")
                if not isinstance(q["correctAnswer"], int) or q["correctAnswer"] < 0 or q["correctAnswer"] > 3:
                    raise ValueError(f"MCQ question {idx} correctAnswer must be 0-3")
            elif q_type == "true_false":
                if idx < 3:
                    raise ValueError(f"True/False question found at position {idx}, but only last 2 should be True/False")
                if not isinstance(q["options"], list) or len(q["options"]) != 2:
                    raise ValueError(f"True/False question {idx} must have exactly 2 options")
                if q["options"] != ["True", "False"]:
                    raise ValueError(f"True/False question {idx} options must be ['True', 'False']")
                if not isinstance(q["correctAnswer"], int) or q["correctAnswer"] < 0 or q["correctAnswer"] > 1:
                    raise ValueError(f"True/False question {idx} correctAnswer must be 0 or 1")
            else:
                raise ValueError(f"Invalid questionType: {q_type}")
        
        return questions
        
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Gemini JSON response: {e}. Response: {response_text}")
    except Exception as e:
        raise RuntimeError(f"Gemini API error: {str(e)}")


async def generate_audio_quiz_question(
    paragraphs_text: str
) -> List[Dict[str, Any]]:
    """
    Generate 1 theoretical question for audio quiz based on relevant paragraphs.

    Args:
        paragraphs_text: The text content from relevant paragraphs

    Returns:
        List with single dictionary containing theoretical question
        - question: str - Theoretical question (couple of sentences max)
        - questionType: str - "elaborate"
        - options: List[str] - Empty list (no multiple choice)
        - correctAnswer: int - -1 (not applicable for open-ended)
    """
    model = initialize_gemini()
    
    prompt = f"""Generate exactly 1 theoretical quiz question based on these paragraphs:
{paragraphs_text}

The question should:
- Be theoretical and directly related to the concepts in the context
- Be concise: maximum 2 sentences long
- Test understanding of theoretical concepts from the content
- Use basic english and avoid complex words

Return your response as a JSON array with exactly one question in this exact format:
[
  {{
    "question": "Theoretical question about concepts from the paragraphs (max 2 sentences)...",
    "questionType": "elaborate",
    "options": [],
    "correctAnswer": -1
  }}
]

Important:
- Only return 1 question
- questionType must be "elaborate"
- options must be an empty array []
- correctAnswer must be -1
- Question must be theoretical and based on the paragraphs
- Question must be concise (1-2 sentences maximum)
- Focus on theoretical understanding, not practical application

Return ONLY the JSON array, no other text."""

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt)
        )
        response_text = response.text.strip()
        
        # Clean up response text
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
        if len(questions) != 1:
            raise ValueError(f"Expected 1 question, got {len(questions)}")
        
        q = questions[0]
        if not isinstance(q, dict):
            raise ValueError("Invalid question format")
        if "question" not in q or "questionType" not in q or "options" not in q or "correctAnswer" not in q:
            raise ValueError("Question missing required fields")
        if q["questionType"] != "elaborate":
            raise ValueError("Question type must be 'elaborate'")
        if not isinstance(q["options"], list) or len(q["options"]) != 0:
            raise ValueError("Elaborate question must have empty options array")
        if q["correctAnswer"] != -1:
            raise ValueError("Elaborate question correctAnswer must be -1")
        
        return questions
        
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Gemini JSON response: {e}. Response: {response_text}")
    except Exception as e:
        raise RuntimeError(f"Gemini API error: {str(e)}")


async def evaluate_audio_answer(
    question: str,
    transcribed_answer: str,
    topic: str
) -> Dict[str, Any]:
    """
    Evaluate an audio quiz answer using Gemini for articulateness assessment.

    Args:
        question: The elaborate question that was asked
        transcribed_answer: The user's transcribed spoken answer
        topic: The topic/context of the quiz

    Returns:
        Dictionary with 'feedback' (text) about articulateness
    """
    model = initialize_gemini()
    
    prompt = f"""Evaluate how articulate and well-expressed a student's spoken answer is to an elaborate quiz question.

Topic: {topic}

Question: {question}

Student's Answer: {transcribed_answer}

Provide constructive feedback (2-3 sentences) specifically about articulation, clarity, and expression:
   - Comment on clarity of expression
   - Comment on structure and organization
   - Comment on how well the ideas are communicated
   - Suggest improvements for better articulation

Return your response as JSON in this exact format:
{{
  "feedback": "Your answer is quite articulate and well-structured. You expressed your ideas clearly and organized your thoughts logically. To improve further, try to use more specific examples and connect your ideas with transitional phrases."
}}

Important:
- Focus ONLY on articulateness, clarity, and expression (not correctness)
- Feedback should be constructive and educational
- Consider clarity, structure, vocabulary, and communication effectiveness

Return ONLY the JSON object, no other text."""

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt)
        )
        response_text = response.text.strip()
        
        # Clean up response text
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse JSON response
        evaluation = json.loads(response_text)
        
        # Validate structure
        if not isinstance(evaluation, dict):
            raise ValueError("Gemini response is not a dictionary")
        if "feedback" not in evaluation:
            raise ValueError("Evaluation missing required field: feedback")
        
        return {
            "feedback": str(evaluation["feedback"])
        }
        
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Gemini JSON response: {e}. Response: {response_text}")
    except Exception as e:
        raise RuntimeError(f"Gemini API error: {str(e)}")