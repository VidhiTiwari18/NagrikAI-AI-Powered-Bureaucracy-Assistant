
from datetime import date, datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


class ApplicationCreate(BaseModel):
    applicant_name: str = Field(
        min_length=2,
        max_length=120,
    )

    date_of_birth: date

    service_type: Literal["fresh"] = "fresh"

    processing_type: Literal["normal"] = "normal"

    citizenship_basis: Literal["birth"] = "birth"

    @field_validator("applicant_name")
    @classmethod
    def validate_applicant_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Applicant name cannot be empty.")

        return value

    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(cls, value: date) -> date:
        today = date.today()

        if value >= today:
            raise ValueError("Date of birth must be in the past.")

        age = (
            today.year
            - value.year
            - ((today.month, today.day) < (value.month, value.day))
        )

        if age < 18:
            raise ValueError(
                "This initial application workflow supports adults aged 18 or above."
            )

        return value


class ApplicationUpdate(BaseModel):
    applicant_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )

    date_of_birth: date | None = None

    service_type: Literal["fresh"] | None = None

    processing_type: Literal["normal"] | None = None

    citizenship_basis: Literal["birth"] | None = None

    application_status: Literal[
        "draft",
        "submitted",
        "pending",
        "in_progress",
        "completed",
        "approved",
        "rejected",
    ] | None = None

    @field_validator("applicant_name")
    @classmethod
    def validate_applicant_name(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise ValueError("Applicant name cannot be empty.")

        return value

    @field_validator("date_of_birth")
    @classmethod
    def validate_date_of_birth(
        cls,
        value: date | None,
    ) -> date | None:
        if value is None:
            return value

        today = date.today()

        if value >= today:
            raise ValueError("Date of birth must be in the past.")

        age = (
            today.year
            - value.year
            - ((today.month, today.day) < (value.month, value.day))
        )

        if age < 18:
            raise ValueError(
                "This initial application workflow supports adults aged 18 or above."
            )

        return value


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    applicant_name: str
    date_of_birth: date
    service_type: str
    processing_type: str
    citizenship_basis: str
    application_status: str
    created_at: datetime
    updated_at: datetime
