import json

from app.core.gemini_client import client


def extract_document_information(extracted_text: str) -> dict:
    prompt = f"""
You are an AI document information extraction system.

Analyze the document text below.

Extract all important information.

Return ONLY valid JSON.

Example:

{{
    "confidence": 98,
    "fields": {{
        "Name": "...",
        "Document Number": "...",
        "Date of Birth": "...",
        "University": "...",
        "CGPA": "..."
    }}
}}

Document Text:

{extracted_text}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    text = response.text.strip()

    # Gemini sometimes wraps JSON in ```json ... ```
    if text.startswith("```json"):
        text = text.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(text)

    except json.JSONDecodeError:
        return {
            "confidence": 0,
            "fields": {}
        }