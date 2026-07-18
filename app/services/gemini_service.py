from app.core.gemini_client import client


def classify_document(extracted_text: str) -> str:
    prompt = f"""
You are a document classification system.

Classify the document into ONLY one of these categories:

- Aadhaar Card
- PAN Card
- Passport
- Driving License
- Voter ID
- Birth Certificate
- Death Certificate
- Income Certificate
- Domicile Certificate
- Caste Certificate
- Marksheet
- Degree Certificate
- Scholarship Document
- Unknown

Document Text:
{extracted_text}

Return only the category name.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    return response.text.strip()