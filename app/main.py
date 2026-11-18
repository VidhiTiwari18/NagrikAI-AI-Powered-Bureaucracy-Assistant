
import logging
import os
import uuid
from io import BytesIO
from pathlib import Path

from fastapi import (
    Depends,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.crud.document_crud import (
    get_all_documents,
    get_document_by_id,
    update_document,
    delete_document,
)

from app.crud.application_crud import (
    create_application,
    get_application_by_id,
    get_all_applications,
)

from app.database import models
from app.database.database import Base, engine, get_db
from app.database.models import Document

from app.schemas.response_schema import DocumentResponse
from app.schemas.update_schema import UpdateDocumentRequest

from app.schemas.application_schema import (
    ApplicationCreate,
    ApplicationResponse,
)

from app.schemas.passport_schema import PassportChecklistRequest

from app.services.extraction_service import extract_document_information
from app.services.ocr_service import extract_text
from app.services.passport_rules import build_passport_document_checklist


# --------------------------------------------------
# APPLICATION CONFIGURATION
# --------------------------------------------------

app = FastAPI(
    title="NagrikAI",
    description="AI-powered Indian Government Document Assistance System",
    version="1.0.0",
)

# Allow communication between React frontend and FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".jpg": "JPEG",
    ".jpeg": "JPEG",
    ".png": "PNG",
}


# --------------------------------------------------
# HOME API
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "NagrikAI is running",
        "status": "success",
    }


# --------------------------------------------------
# APPLICATION APIs
# --------------------------------------------------

@app.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=201,
)
def create_application_api(
    request: ApplicationCreate,
    db: Session = Depends(get_db),
):
    application = create_application(
        db=db,
        application_data=request,
    )

    return application


@app.get(
    "/applications",
    response_model=list[ApplicationResponse],
)
def read_applications(
    db: Session = Depends(get_db),
):
    return get_all_applications(db)


@app.get(
    "/applications/{application_id}",
    response_model=ApplicationResponse,
)
def read_application(
    application_id: int,
    db: Session = Depends(get_db),
):
    application = get_application_by_id(
        db=db,
        application_id=application_id,
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    return application


# --------------------------------------------------
# PASSPORT CHECKLIST API
# --------------------------------------------------

@app.post(
    "/passport/checklist",
    tags=["Passport"],
)
def get_passport_checklist(
    request: PassportChecklistRequest,
):
    """
    Generate a document checklist for an adult,
    fresh ordinary passport application under the
    initial Normal processing workflow.

    This is guidance, not an official eligibility decision.
    """

    checklist = build_passport_document_checklist(
        is_non_ecr_eligible=request.is_non_ecr_eligible,
        claims_non_ecr=request.claims_non_ecr,
        post_police_verification_required=(
            request.post_police_verification_required
        ),
    )

    return checklist


# --------------------------------------------------
# DOCUMENT APIs
# --------------------------------------------------

@app.get("/documents")
def read_documents(
    db: Session = Depends(get_db),
):
    return get_all_documents(db)


@app.get("/documents/{document_id}")
def read_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    document = get_document_by_id(db, document_id)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    return document


@app.put("/documents/{document_id}")
def update_document_api(
    document_id: int,
    request: UpdateDocumentRequest,
    db: Session = Depends(get_db),
):
    document = update_document(
        db=db,
        document_id=document_id,
        document_type=request.document_type,
        extracted_fields=request.extracted_fields,
    )

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    return document


@app.delete("/documents/{document_id}")
def delete_document_api(
    document_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_document(db, document_id)

    if deleted is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    return {
        "message": "Document deleted successfully"
    }


# --------------------------------------------------
# DOCUMENT UPLOAD API
# --------------------------------------------------

@app.post(
    "/upload",
    response_model=DocumentResponse,
)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    saved_file_path = None

    try:
        # 1. Validate filename and extension.

        original_filename = os.path.basename(
            (file.filename or "").replace("\\", "/")
        )

        extension = Path(original_filename).suffix.lower()

        if not original_filename or extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail="Only JPG, JPEG and PNG files are allowed.",
            )

        # 2. Read file and enforce size limit.

        content = await file.read(MAX_FILE_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty.",
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="File size must not exceed 5 MB.",
            )

        # 3. Validate actual image content.

        try:
            with Image.open(BytesIO(content)) as image:
                actual_format = image.format
                image.verify()

        except (
            UnidentifiedImageError,
            OSError,
            Image.DecompressionBombError,
        ):
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is not a valid image.",
            )

        expected_format = ALLOWED_EXTENSIONS[extension]

        if actual_format != expected_format:
            raise HTTPException(
                status_code=400,
                detail="File extension does not match the actual image format.",
            )

        # 4. Generate a unique filename.

        os.makedirs("uploads", exist_ok=True)

        unique_filename = f"{uuid.uuid4().hex}{extension}"

        saved_file_path = os.path.join(
            "uploads",
            unique_filename,
        )

        with open(saved_file_path, "wb") as destination:
            destination.write(content)

        # 5. Extract text using OCR.

        extracted_text = extract_text(saved_file_path)

        # 6. Extract information using Gemini Vision.

        document_information = extract_document_information(
            image_path=saved_file_path,
            extracted_text=extracted_text,
        )

        # 7. Save extracted information in database.

        validation_data = document_information.get(
            "validation",
            {
                "is_complete": False,
                "missing_fields": [],
                "warnings": [
                    "Validation information unavailable."
                ],
            },
        )

        fields_data = document_information.get("fields", {})

        document = Document(
            filename=original_filename,
            document_type=document_information.get(
                "document_type",
                "Unknown",
            ),
            confidence=document_information.get("confidence", 0),
            extracted_fields=fields_data,
            validation=validation_data,
            ocr_text=extracted_text,
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        # 8. Return structured response.

        return DocumentResponse(
            filename=original_filename,
            document_type=document_information.get(
                "document_type",
                "Unknown",
            ),
            confidence=document_information.get("confidence", 0),
            fields=fields_data,
            validation=validation_data,
            extracted_text=extracted_text,
        )

    except HTTPException:
        raise

    except Exception:
        db.rollback()

        if saved_file_path and os.path.exists(saved_file_path):
            os.remove(saved_file_path)

        logger.exception(
            "Document upload or processing failed."
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to process the uploaded document. Please try again.",
        )

    finally:
        await file.close()
