# Recall FastAPI Quiz Backend

FastAPI backend service for generating quiz questions based on topics using Gemini AI and MongoDB.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file (copy from `env.example`):
```bash
cp env.example .env
```

3. Configure environment variables in `.env`:
- `MONGO_URI` - MongoDB Atlas connection string
- `MONGO_DB` - Database name (default: "recall")
- `HF_API_KEY` - Hugging Face API key for embeddings
- `GEMINI_API_KEY` - Google Gemini API key
- `PORT` - Server port (default: 8000)

## Running

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

### POST /quiz/generate

Generate quiz questions based on a topic.

**Request:**
```json
{
  "topic": "machine learning",
  "numQuestions": 5
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "What is machine learning?",
      "idealAnswer": "Machine learning is...",
      "paragraphIds": ["id1", "id2", "id3"]
    }
  ],
  "topic": "machine learning",
  "paragraphsUsed": [...]
}
```

### GET /health

Health check endpoint.

## Notes

- Assumes paragraphs are stored in MongoDB with individual embeddings
- Uses cosine similarity to find top 3 most relevant paragraphs
- Questions are stored in MongoDB for reuse
- Runs on port 8000 by default (Express backend runs on 3001)
