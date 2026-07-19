from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, JSON, String, Text
from app.database.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String, nullable=False)

    document_type = Column(String, nullable=False)

    confidence = Column(Integer, nullable=False)

    extracted_fields = Column(JSON, nullable=False)

    validation = Column(JSON, nullable=False)

    ocr_text = Column(Text, nullable=False)

    upload_time = Column(DateTime, default=datetime.utcnow)