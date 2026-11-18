
from sqlalchemy.orm import Session

from app.database.models import Application
from app.schemas.application_schema import ApplicationCreate


def create_application(
    db: Session,
    application_data: ApplicationCreate,
):
    application = Application(
        applicant_name=application_data.applicant_name,
        date_of_birth=application_data.date_of_birth,
        service_type=application_data.service_type,
        processing_type=application_data.processing_type,
        citizenship_basis=application_data.citizenship_basis,
        application_status="draft",
    )

    try:
        db.add(application)
        db.commit()
        db.refresh(application)

        return application

    except Exception:
        db.rollback()
        raise


def get_application_by_id(
    db: Session,
    application_id: int,
):
    return (
        db.query(Application)
        .filter(Application.id == application_id)
        .first()
    )


def get_all_applications(db: Session):
    return (
        db.query(Application)
        .order_by(Application.created_at.desc())
        .all()
    )
