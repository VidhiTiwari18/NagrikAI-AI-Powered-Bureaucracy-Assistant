from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse

from app.services.ocr_service import extract_text
from app.services.gemini_service import classify_document
from app.services.extraction_service import extract_document_information

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "NagrikAI is running"
    }


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    # Read uploaded file
    content = await file.read()

    # Validate file extension
    extension = file.filename.split(".")[-1].lower()
    allowed_extensions = ["jpg", "jpeg", "png"]

    if extension not in allowed_extensions:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Only JPG, JPEG and PNG files are allowed"
            }
        )

    # Save uploaded file
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as f:
        f.write(content)

    # OCR
    extracted_text = extract_text(file_path)

    # Document Classification
    document_type = classify_document(extracted_text)

    # Information Extraction
    document_information = extract_document_information(extracted_text)

    # Return Response
    return {
        "filename": file.filename,
        "document_type": document_type,
        "confidence": document_information.get("confidence", 0),
        "fields": document_information.get("fields", {}),
        "extracted_text": extracted_text
    }