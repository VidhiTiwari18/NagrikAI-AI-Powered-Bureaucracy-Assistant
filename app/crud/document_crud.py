from sqlalchemy.orm import Session
from app.database.models import Document


def get_all_documents(db: Session):
    return db.query(Document).all()


def get_document_by_id(db: Session, document_id: int):
    return db.query(Document).filter(Document.id == document_id).first()


def update_document(
    db: Session,
    document_id: int,
    document_type: str,
    extracted_fields: dict,
):
    document = db.query(Document).filter(Document.id == document_id).first()

    if document is None:
        return None

    document.document_type = document_type
    document.extracted_fields = extracted_fields

    db.commit()
    db.refresh(document)

    return document


def delete_document(
    db: Session,
    document_id: int,
):
    document = db.query(Document).filter(Document.id == document_id).first()

    if document is None:
        return None

    db.delete(document)
    db.commit()

    return True