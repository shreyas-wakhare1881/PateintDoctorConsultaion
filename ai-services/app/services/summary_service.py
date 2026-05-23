import httpx
import os

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
BIOMISTRAL_MODEL = os.getenv("BIOMISTRAL_MODEL", "biomistral")

async def generate_summary(transcript: str) -> str:
    prompt = f"""You are a clinical assistant. Based on the following consultation transcript,
generate a concise, accurate medical summary in plain language.

Transcript:
{transcript}

Summary:"""

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": BIOMISTRAL_MODEL, "prompt": prompt, "stream": False},
        )
        response.raise_for_status()
        return response.json().get("response", "")
