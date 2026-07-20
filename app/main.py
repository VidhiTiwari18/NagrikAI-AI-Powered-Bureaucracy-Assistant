import os
from fastapi import Depends, FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.crud.document_crud import (get_all_documents,get_document_by_id,)
from app.database import models
from app.database.database import Base, engine, get_db
from app.database.models import Document
from app.schemas.response_schema import DocumentResponse
from app.services.extraction_service import extract_document_information
from app.services.ocr_service import extract_text

app = FastAPI()

Base.metadata.create_all(bind=engine)


@app.get("/")
def home():
    return {
        "message": "NagrikAI is running"
    }
@app.get("/documents")
def read_documents(
    db: Session = Depends(get_db)
):
    documents = get_all_documents(db)
    return documents

@app.get("/documents/{document_id}")
def read_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    document = get_document_by_id(db, document_id)

    if document is None:
        return JSONResponse(
            status_code=404,
            content={
                "error": "Document not found"
            }
        )

    return document

@app.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
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

    # Save to Database
    document = Document(
        filename=file.filename,
        document_type=document_information.get("document_type", "Unknown"),
        confidence=document_information.get("confidence", 0),
        extracted_fields=document_information.get("fields", {}),
        validation=document_information.get(
            "validation",
            {
                "is_complete": False,
                "missing_fields": [],
                "warnings": []
            }
        ),
        ocr_text=extracted_text,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

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