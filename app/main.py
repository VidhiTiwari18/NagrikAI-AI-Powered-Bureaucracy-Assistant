import os

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse

from app.schemas.response_schema import DocumentResponse
from app.services.ocr_service import extract_text
from app.services.extraction_service import extract_document_information

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "NagrikAI is running"
    }


@app.post("/upload", response_model=DocumentResponse)
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

    # Create uploads folder if it doesn't exist
    os.makedirs("uploads", exist_ok=True)

    # Save uploaded file
    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as f:
        f.write(content)

    # OCR
    extracted_text = extract_text(file_path)

    # Gemini Vision Extraction
    document_information = extract_document_information(
        image_path=file_path,
        extracted_text=extracted_text
    )

    # Return validated response
    return DocumentResponse(
        filename=file.filename,
        document_type=document_information.get("document_type", "Unknown"),
        confidence=document_information.get("confidence", 0),
        fields=document_information.get("fields", {}),
        validation=document_information.get(
            "validation",
            {
                "is_complete": False,
                "missing_fields": [],
                "warnings": []
            }
        ),
        extracted_text=extracted_text,
    )