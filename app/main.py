from fastapi import FastAPI, UploadFile, File
import easyocr
from google import genai
from dotenv import load_dotenv
import os
from app.services.ocr_service import extract_text

app = FastAPI()

load_dotenv()

# Gemini Setup
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

@app.get("/")
def home():
    return {
        "message": "NagrikAI is running"
    }

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):

    content = await file.read()

    extension = file.filename.split(".")[-1].lower()

    allowed_extensions = ["jpg", "jpeg", "png"]

    if extension not in allowed_extensions:
        return {
            "error": "Only JPG, JPEG and PNG files are allowed"
        }

    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as f:
        f.write(content)

        extracted_text = extract_text(file_path)

    # Gemini Classification
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
    contents=prompt
    )

    document_type = response.text.strip()

    return {
        "filename": file.filename,
        "document_type": document_type,
        "extracted_text": extracted_text
    }