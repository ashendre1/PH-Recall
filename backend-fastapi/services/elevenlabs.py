# ── Eleven Labs Service ────────────────────────────────
# Speech-to-text conversion with word-level timestamps for audio quiz.

import os
import httpx
from typing import Optional, List, Dict, Any


def get_api_key() -> Optional[str]:
    """Get Eleven Labs API key from environment."""
    api_key = os.getenv("ELEVENLABS_API_KEY") or os.getenv("ELEVEN_API_KEY")
    if not api_key:
        print("[elevenlabs] ELEVENLABS_API_KEY or ELEVEN_API_KEY not set")
        return None
    return api_key


async def transcribe_audio_with_timestamps(
    audio_data: bytes,
    audio_format: str = "mp3"
) -> Dict[str, Any]:
    """
    Transcribe audio using Eleven Labs Speech-to-Text API with word-level timestamps.
    
    Args:
        audio_data: Raw audio file bytes
        audio_format: Audio format (mp3, wav, etc.)
        
    Returns:
        Dictionary with:
        - text: Full transcribed text
        - words: List of word objects with start_time, end_time, word
        - is_hesitant: Boolean indicating if gaps > 3 seconds found
        - hesitancy_feedback: Feedback about hesitancy
    """
    api_key = get_api_key()
    if not api_key:
        raise ValueError("Eleven Labs API key not configured")
    
    # Eleven Labs Speech-to-Text API endpoint
    url = "https://api.elevenlabs.io/v1/speech-to-text"
    
    headers = {
        "xi-api-key": api_key,
    }
    
    # Eleven Labs API expects the file field to be named "file" (confirmed by error message)
    # Format: (filename, file_content, content_type)
    files = {
        "file": (f"audio.{audio_format}", audio_data, f"audio/{audio_format}")
    }
    
    # Form data fields - these will be combined with files in multipart/form-data
    data = {
        "model_id": "scribe_v2",  # or appropriate model
        "word_timestamps": "true"  # Request word-level timestamps
    }
    
    print(f"[elevenlabs] Sending audio to STT API: format={audio_format}, size={len(audio_data)} bytes")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # httpx will automatically combine files and data into multipart/form-data
            response = await client.post(url, headers=headers, files=files, data=data)
            
            print(f"[elevenlabs] API response status: {response.status_code}")
            print(f"[elevenlabs] API response headers: {dict(response.headers)}")
            
            response_text = response.text
            print(f"[elevenlabs] Full API response body: {response_text}")
            
            if not response.is_success:
                raise RuntimeError(
                    f"Eleven Labs API error ({response.status_code}): {response_text}"
                )
            
            result = response.json()
            print(f"[elevenlabs] Parsed JSON response: {result}")
            
            # Extract transcription and word timestamps
            text = result.get("text", "") or result.get("transcription", "")
            all_words = result.get("words", []) or result.get("word_timestamps", [])
            
            # Filter out spacing entries - only keep actual words (type == 'word')
            words = [w for w in all_words if w.get("type") == "word"]
            
            print(f"[elevenlabs] Total items: {len(all_words)}, Actual words: {len(words)}")
            
            # Calculate gaps between consecutive words
            is_hesitant = False
            hesitancy_feedback = ""
            
            if len(words) > 1:
                gaps = []
                large_gaps_count = 0
                
                has_very_large_gap = False
                
                for i in range(len(words) - 1):
                    current_word = words[i]
                    next_word = words[i + 1]
                    
                    # Get timestamps (Eleven Labs uses 'start' and 'end')
                    current_end = current_word.get("end", 0)
                    next_start = next_word.get("start", 0)
                    
                    gap = next_start - current_end
                    if gap > 0:  # Only count positive gaps
                        gaps.append(gap)
                        
                        # Check for very large gap (> 2 seconds)
                        if gap > 1.5:
                            has_very_large_gap = True
                            print(f"[elevenlabs] Very large gap detected: {gap:.2f}s between '{current_word.get('text', '')}' and '{next_word.get('text', '')}'")
                        
                        # Count gaps greater than 0.6 seconds
                        if gap > 0.6:
                            large_gaps_count += 1
                            print(f"[elevenlabs] Large gap detected: {gap:.2f}s between '{current_word.get('text', '')}' and '{next_word.get('text', '')}'")
                
                # Mark as hesitant if:
                # 1. Any gap is greater than 2 seconds, OR
                # 2. More than 5 gaps are greater than 0.6 seconds
                is_hesitant = has_very_large_gap or large_gaps_count > 2
                
                print(f"[elevenlabs] Gap analysis: total gaps={len(gaps)}, large_gaps(>0.6s)={large_gaps_count}, very_large_gap(>2s)={has_very_large_gap}, is_hesitant={is_hesitant}")
                
                if gaps:
                    max_gap = max(gaps)
                    avg_gap = sum(gaps) / len(gaps) if gaps else 0
                    
                    if is_hesitant:
                        if has_very_large_gap:
                            hesitancy_feedback = (
                                f"Your answer shows significant hesitation with pauses up to {max_gap:.1f} seconds. "
                                "Try to speak more fluently and confidently. Practice can help reduce long pauses."
                            )
                        else:
                            hesitancy_feedback = (
                                f"Your answer shows hesitation with {large_gaps_count} pauses longer than 0.6 seconds "
                                f"(max gap: {max_gap:.1f}s, average: {avg_gap:.1f}s). "
                                "Try to speak more fluently and confidently. Practice can help reduce pauses."
                            )
                    else:
                        hesitancy_feedback = (
                            f"Your speech flow is good with minimal pauses "
                            f"(max gap: {max_gap:.1f}s, average: {avg_gap:.1f}s). "
                            "Keep up the confident delivery!"
                        )
                else:
                    hesitancy_feedback = "Speech flow analysis completed."
            else:
                hesitancy_feedback = "Not enough words to analyze speech flow. Try speaking more."
            
            return {
                "text": text,
                "words": words,
                "is_hesitant": is_hesitant,
                "hesitancy_feedback": hesitancy_feedback
            }
            
    except httpx.HTTPError as e:
        raise RuntimeError(f"HTTP error calling Eleven Labs API: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Eleven Labs API error: {str(e)}")


async def generate_audio_feedback(text: str) -> Optional[str]:
    """
    Generate audio feedback from text using Eleven Labs TTS.
    
    Args:
        text: The feedback text to convert to speech
        
    Returns:
        URL or file path to the generated audio, or None if not implemented
        
    TODO: Implement Eleven Labs text-to-speech conversion
    """
    # This is for TTS feedback - can be implemented later
    return None
