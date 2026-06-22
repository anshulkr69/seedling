import logging
from typing import Tuple
from tenacity import retry, stop_after_attempt, wait_exponential
from config.settings import settings

logger = logging.getLogger("drafting.llm_client")

# Initialize Groq client if API key is provided
groq_client = None
try:
    import groq
    from groq import Groq
    if settings.groq_api_key:
        groq_client = Groq(api_key=settings.groq_api_key)
        logger.info("Groq client initialized successfully.")
    else:
        logger.warning("GROQ_API_KEY not found in settings. Groq client will not be available.")
except ImportError:
    logger.error("groq package not installed.")

# Initialize Google GenAI client if API key is provided
gemini_client = None
try:
    from google import genai
    from google.genai import types
    if settings.google_ai_studio_api_key:
        gemini_client = genai.Client(api_key=settings.google_ai_studio_api_key)
        logger.info("Google GenAI client initialized successfully.")
    else:
        logger.warning("GOOGLE_AI_STUDIO_API_KEY not found in settings. Gemini fallback will not be available.")
except ImportError:
    logger.error("google-genai package not installed.")

# Retry decorator for Groq API calls (specifically targets RateLimitError and transient network issues)
@retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    reraise=True
)
def call_groq_api_with_retry(system_prompt: str, user_prompt: str) -> str:
    """
    Invokes the Groq API with automatic retries for rate limits or connection errors.
    """
    if not groq_client:
        raise RuntimeError("Groq client is not initialized.")
        
    logger.info("Attempting Groq LLM generation (llama-3.1-8b-instant)...")
    completion = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        max_tokens=2000,
        temperature=0.4
    )
    
    if not completion.choices or not completion.choices[0].message.content:
        raise ValueError("Groq returned an empty response.")
        
    return completion.choices[0].message.content

def call_gemini_fallback(system_prompt: str, user_prompt: str) -> str:
    """
    Invokes the Gemini API (gemini-2.5-flash-lite) as a fallback option.
    """
    # Verify package and key
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        raise RuntimeError("google-genai library is not available.")
        
    if not settings.google_ai_studio_api_key:
        raise RuntimeError("GOOGLE_AI_STUDIO_API_KEY is not configured.")
        
    if not gemini_client:
        raise RuntimeError("Gemini client is not initialized.")
        
    logger.info("Attempting Gemini fallback generation (gemini-2.5-flash-lite)...")
    
    # Generate content using google-genai SDK
    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.4,
            max_output_tokens=2000
        )
    )
    
    if not response.text:
        raise ValueError("Gemini returned an empty response.")
        
    return response.text

def generate_draft_llm(system_prompt: str, user_prompt: str) -> Tuple[str, str, bool]:
    """
    Generates a draft using the primary LLM provider (Groq) with failover to the fallback provider (Gemini).
    
    Returns:
        tuple: (draft_text, provider_used, fallback_used)
    """
    provider_used = "unknown"
    fallback_used = False
    draft_text = ""
    
    # Attempt 1: Groq
    if groq_client:
        try:
            draft_text = call_groq_api_with_retry(system_prompt, user_prompt)
            provider_used = "groq/llama-3.1-8b-instant"
            logger.info("Successfully generated draft using Groq.")
            return draft_text, provider_used, fallback_used
        except Exception as e:
            logger.warning(f"Groq generation failed after retries: {e}. Attempting failover to Gemini...")
            
    # Attempt 2: Gemini Fallback
    if settings.google_ai_studio_api_key:
        try:
            draft_text = call_gemini_fallback(system_prompt, user_prompt)
            provider_used = "google/gemini-2.5-flash-lite"
            fallback_used = True
            logger.info("Successfully generated draft using Gemini fallback.")
            return draft_text, provider_used, fallback_used
        except Exception as e:
            logger.error(f"Gemini fallback generation failed: {e}")
            raise RuntimeError(f"Both Groq and Gemini generation failed. Last error: {str(e)}")
            
    raise RuntimeError("No LLM clients initialized or both primary/fallback calls failed.")
