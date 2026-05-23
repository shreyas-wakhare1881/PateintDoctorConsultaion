def build_summary_prompt(transcript: str) -> str:
    return f"""You are a clinical assistant. Summarize the following consultation transcript
concisely and accurately for medical records.

Transcript:
{transcript}

Summary:"""
