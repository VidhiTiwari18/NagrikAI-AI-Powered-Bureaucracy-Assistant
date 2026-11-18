
from pydantic import BaseModel


class PassportChecklistRequest(BaseModel):
    is_non_ecr_eligible: bool | None = None
    claims_non_ecr: bool | None = None
    post_police_verification_required: bool | None = None
