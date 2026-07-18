import json

from app.core.gemini_client import client


def extract_document_information(extracted_text: str) -> dict:
   prompt = f"""
You are an expert AI system for extracting information from Indian government documents.

Rules:
1. Use ONLY the information present in the document.
2. Never guess or invent values.
3. If a field is missing, return "Not Found".
4. Do not confuse officer names, digital signature names, or issuing authority names with the person's name.
5. Extract the primary person's information only.
6. Return ONLY valid JSON.

Format:

{{
  "confidence": 0,
  "fields": {{
    "Name": "",
    "Father Name": "",
    "Mother Name": "",
    "Date of Birth": "",
    "Document Number": "",
    "Issuing Authority": ""
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