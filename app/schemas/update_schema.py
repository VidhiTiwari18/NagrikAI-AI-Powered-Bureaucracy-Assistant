from typing import Dict
from pydantic import BaseModel


class UpdateDocumentRequest(BaseModel):
    document_type: str
    extracted_fields: Dict[str, str]