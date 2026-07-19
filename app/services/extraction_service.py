import json
import mimetypes
from pathlib import Path

from google.genai import types

from app.core.gemini_client import client


def extract_document_information(image_path: str, extracted_text: str) -> dict:
    # Read image
    image_bytes = Path(image_path).read_bytes()

    # Detect image mime type
    mime_type = mimetypes.guess_type(image_path)[0] or "image/jpeg"

    prompt = f"""
You are an expert AI system for understanding Indian government documents.

You are given:
1. The original document image.
2. OCR extracted text.

The image is the primary source of truth.
OCR text is only additional context.

Your tasks are:

1. Identify the document type.
2. Extract ONLY the fields that belong to that document.
3. Do NOT create unnecessary fields.
4. Never guess values.
5. If a value exists but is unreadable, return "Unreadable".
6. If a field truly doesn't exist on the document, do NOT include it.
7. Ignore digital signatures, QR codes, logos, stamps and decorative text unless they contain useful information.
8. Return ONLY valid JSON.
9. Confidence should be between 0 and 100.

OCR Text:

{extracted_text}

Return JSON exactly like this:

{{
    "document_type": "",
    "confidence": 0,
    "fields": {{
        "Field Name": "Value",
        "Another Field": "Value"
    }},
    "validation": {{
        "is_complete": true,
        "missing_fields": [],
        "warnings": []
    }}
}}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            prompt,
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type,
            ),
        ],
    )

    text = response.text.strip()

    if text.startswith("```json"):
        text = text.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(text)

    except Exception:
        return {
    "document_type": "Unknown",
    "confidence": 0,
    "fields": {},
    "validation": {
        "is_complete": False,
        "missing_fields": [],
        "warnings": [
            "Unable to parse Gemini response."
        ]
    }
}