from typing import Dict, List
from pydantic import BaseModel

class ValidationModel(BaseModel):
    is_complete: bool
    missing_fields: List[str]
    warnings: List[str]

class DocumentResponse(BaseModel):
    filename: str
    document_type: str
    confidence: int
    fields: Dict[str, str]
    validation: ValidationModel
    extracted_text: str