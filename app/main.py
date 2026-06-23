from fastapi import FastAPI, UploadFile, File
import easyocr
import google.generativeai as genai

app = FastAPI()

# OCR Model
reader = easyocr.Reader(['en'])

# Gemini Setup
genai.configure(api_key="NagrikAI")

model = genai.GenerativeModel("gemini-2.5-flash")

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

    # OCR
    result = reader.readtext(file_path)

    extracted_text = "\n".join(
        [item[1] for item in result]
    )

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

    response = model.generate_content(prompt)

    document_type = response.text.strip()

    return {
        "filename": file.filename,
        "document_type": document_type,
        "extracted_text": extracted_text
    }