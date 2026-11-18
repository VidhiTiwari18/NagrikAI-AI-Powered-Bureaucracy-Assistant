
import json
import mimetypes
from pathlib import Path

from google.genai import types

from app.core.gemini_client import client


def extract_document_information(image_path: str, extracted_text: str) -> dict:
    image_bytes = Path(image_path).read_bytes()
    mime_type = mimetypes.guess_type(image_path)[0] or "image/jpeg"

    prompt = f"""
You are an AI system for understanding Indian passports.

IMPORTANT RULES:
- Use the original image as the primary source of truth.
- Use OCR text only as supporting evidence.
- Never guess, infer, or invent information.
- Extract only information visibly present in the uploaded image.
- If a visible value is unreadable, use "Unreadable".

TASKS:

1. Determine whether the document is an Indian passport.
2. If it is not clearly an Indian passport, return document_type as "Unknown" and empty fields.
3. Extract visible information using these field names when applicable:
   Passport Number, Surname, Given Name(s), Nationality,
   Date of Birth, Sex, Place of Birth, Place of Issue,
   Date of Issue, Date of Expiry, Father's Name,
   Mother's Name, Spouse's Name.
4. Include only fields actually visible on the uploaded page.
5. Do not assume that every passport contains every listed field.
6. NEVER mark Father's Name, Mother's Name, or Spouse's Name
   as missing merely because they are not visible on the uploaded page.
7. Do not assess whether the entire passport application is complete.
8. Set missing_fields to an empty list.
9. Set is_complete to true only if the information visible
   on the supplied page has been reliably extracted.
10. Add warnings for unreadable, ambiguous, or conflicting values.
11. Set confidence between 0 and 100 based on visible evidence.
12. Return only valid JSON without Markdown.

OCR TEXT:
{extracted_text}

Return this JSON structure:

{{
    "document_type": "Indian Passport or Unknown",
    "confidence": 0,
    "fields": {{}},
    "validation": {{
        "is_complete": false,
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

    response_text = (response.text or "").strip()

    # Remove optional Markdown code fences.
    if response_text.startswith("```"):
        response_text = response_text.split("\n", 1)[-1]
        response_text = response_text.removesuffix("```").strip()

    try:
        result = json.loads(response_text)

        if not isinstance(result, dict):
            raise ValueError("Expected a JSON object.")

        document_type = str(result.get("document_type", "")).strip()

        if document_type.lower() != "indian passport":
            return {
                "document_type": "Unknown",
                "confidence": 0,
                "fields": {},
                "validation": {
                    "is_complete": False,
                    "missing_fields": [],
                    "warnings": [
                        "The document could not be verified as an Indian passport."
                    ],
                },
            }

        fields = result.get("fields", {})
        validation = result.get("validation", {})

        if not isinstance(fields, dict):
            raise ValueError("Invalid fields structure.")

        if not isinstance(validation, dict):
            raise ValueError("Invalid validation structure.")

        # Normalize confidence.
        try:
            confidence = int(result.get("confidence", 0))
        except (ValueError, TypeError):
            confidence = 0

        confidence = max(0, min(100, confidence))

        # Normalize extracted fields.
        normalized_fields = {}

        for key, value in fields.items():
            if value is not None:
                normalized_fields[str(key)] = str(value)

        # Normalize warnings.
        warnings = validation.get("warnings", [])

        if not isinstance(warnings, list):
            warnings = ["Invalid warnings format"]

        warnings = [str(item) for item in warnings]

        # Missing application documents are checked separately
        # by the future passport compliance engine.
        missing_fields = []

        is_complete = (
            validation.get("is_complete", False) is True
            and len(warnings) == 0
        )

        return {
            "document_type": "Indian Passport",
            "confidence": confidence,
            "fields": normalized_fields,
            "validation": {
                "is_complete": is_complete,
                "missing_fields": missing_fields,
                "warnings": warnings,
            },
        }

    except (json.JSONDecodeError, ValueError, TypeError):
        return {
            "document_type": "Unknown",
            "confidence": 0,
            "fields": {},
            "validation": {
                "is_complete": False,
                "missing_fields": [],
                "warnings": [
                    "Unable to parse or validate the Gemini response."
                ],
            },
        }
