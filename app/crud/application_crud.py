
from sqlalchemy.orm import Session

from app.database.models import Application, ApplicationDocument
from app.schemas.application_schema import (
    ApplicationCreate,
    ApplicationUpdate,
)


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


def update_application(
    db: Session,
    application: Application,
    application_data: ApplicationUpdate,
):
    update_data = application_data.model_dump(
        exclude_unset=True,
        exclude_none=True,
    )

    if not update_data:
        return application

    try:
        for field, value in update_data.items():
            setattr(application, field, value)

        db.commit()
        db.refresh(application)

        return application

    except Exception:
        db.rollback()
        raise


def delete_application(
    db: Session,
    application: Application,
):
    try:
        # Delete application-document links first.
        db.query(ApplicationDocument).filter(
            ApplicationDocument.application_id == application.id
        ).delete(synchronize_session=False)

        # Delete the application itself.
        db.delete(application)

        db.commit()

        return True

    except Exception:
        db.rollback()
        raise
