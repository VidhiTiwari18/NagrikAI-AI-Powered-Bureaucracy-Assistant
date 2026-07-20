from sqlalchemy.orm import Session
from app.database.models import Document

def get_all_documents(db: Session):
    return db.query(Document).all()
def get_document_by_id(db: Session, document_id: int):
    return db.query(Document).filter(Document.id == document_id).first()