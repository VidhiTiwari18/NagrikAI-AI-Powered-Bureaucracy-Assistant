from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def classify_document(extracted_text: str) -> str:
    prompt = f"""
You are a document classification system.

Classify the document into ONLY one of these categories:

- Marksheet
- Caste Certificate
- Passport
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