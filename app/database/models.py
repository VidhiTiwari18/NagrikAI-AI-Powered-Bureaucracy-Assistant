
from datetime import datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)

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


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    applicant_name = Column(String, nullable=False)

    date_of_birth = Column(Date, nullable=False)

    service_type = Column(
        String,
        nullable=False,
        default="fresh",
    )

    processing_type = Column(
        String,
        nullable=False,
        default="normal",
    )

    citizenship_basis = Column(
        String,
        nullable=False,
        default="birth",
    )

    application_status = Column(
        String,
        nullable=False,
        default="draft",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class ApplicationDocument(Base):
    __tablename__ = "application_documents"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(
        Integer,
        ForeignKey("applications.id"),
        nullable=False,
    )

    document_id = Column(
        Integer,
        ForeignKey("documents.id"),
        nullable=False,
    )

    linked_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    __table_args__ = (
        UniqueConstraint(
            "application_id",
            "document_id",
            name="unique_application_document",
        ),
    )
