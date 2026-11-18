
from typing import Any


def build_passport_document_checklist(
    *,
    is_non_ecr_eligible: bool | None = None,
    claims_non_ecr: bool | None = None,
    post_police_verification_required: bool | None = None,
) -> dict[str, Any]:
    """
    Initial NagrikAI workflow:
    Fresh ordinary passport, adult Indian citizen by birth,
    Normal processing.

    This is a guidance checklist, not an official eligibility decision.
    """

    required_documents = [
        {
            "document_number": 1,
            "name": "Proof of Present Address",
            "requirement": "mandatory",
            "description": (
                "Provide one accepted document showing the applicant's "
                "current residential address."
            ),
            "examples": [
                "Aadhaar card or e-Aadhaar",
                "Electricity bill",
                "Water bill",
                "Postpaid telephone or mobile bill",
                "Rent agreement",
                "Photo passbook of an eligible running bank account",
            ],
        },
        {
            "document_number": 2,
            "name": "Proof of Date of Birth",
            "requirement": "mandatory",
            "description": (
                "Provide one accepted document containing the applicant's "
                "complete date of birth."
            ),
            "examples": [
                "Birth certificate",
                "Transfer or school-leaving certificate",
                "Matriculation certificate",
                "PAN card",
                "Driving licence",
                "Election Photo Identity Card",
            ],
        },
    ]

    conditional_documents = []
    warnings = []

    if claims_non_ecr is True and is_non_ecr_eligible is True:
        required_documents.append(
            {
                "document_number": 3,
                "name": "Proof of Non-ECR Eligibility",
                "requirement": "mandatory_for_claimed_non_ecr",
                "description": (
                    "Provide documentary proof supporting the Non-ECR "
                    "eligibility category being claimed."
                ),
                "examples": [
                    "Matriculation certificate or higher educational proof",
                    "Other documentary proof applicable to an eligible category",
                ],
            }
        )

    elif claims_non_ecr is True and is_non_ecr_eligible is False:
        warnings.append(
            "The applicant has indicated a Non-ECR claim, but the supplied "
            "information does not establish eligibility. Verify the "
            "applicable category and evidence before proceeding."
        )

    elif claims_non_ecr is True and is_non_ecr_eligible is None:
        conditional_documents.append(
            {
                "document_number": 3,
                "name": "Proof of Non-ECR Eligibility",
                "requirement": "pending_eligibility_confirmation",
                "description": (
                    "Evidence may be required if the applicant qualifies "
                    "for the Non-ECR category."
                ),
                "action": (
                    "Ask about the applicant's eligibility category and "
                    "request supporting evidence for review."
                ),
            }
        )

    elif claims_non_ecr is None:
        conditional_documents.append(
            {
                "document_number": 3,
                "name": "Proof of Non-ECR Eligibility",
                "requirement": "conditional",
                "description": (
                    "Relevant if the applicant is eligible for and claims "
                    "the Non-ECR category."
                ),
                "action": (
                    "Ask whether the applicant intends to claim Non-ECR "
                    "and establish the applicable eligibility category."
                ),
            }
        )

    # Document No. 41 is not automatically treated as mandatory.
    if post_police_verification_required is True:
        warnings.append(
            "The official booklet conditionally references Document No. 41 "
            "in the post-police-verification context, but defines it as "
            "documents for out-of-turn issuance. Confirm the applicable "
            "requirement with Passport Seva or the jurisdictional "
            "Passport Office."
        )

    elif post_police_verification_required is None:
        warnings.append(
            "The police-verification requirement has not been determined. "
            "NagrikAI must not assume whether pre-police or post-police "
            "verification applies."
        )

    return {
        "application_profile": {
            "service_type": "fresh",
            "passport_type": "ordinary",
            "processing_type": "normal",
            "citizenship_basis": "birth",
            "applicant_category": "adult",
        },
        "required_documents": required_documents,
        "conditional_documents": conditional_documents,
        "warnings": warnings,
        "manual_review_required": bool(warnings),
        "disclaimer": (
            "This checklist is generated for guidance using published "
            "Passport Seva instructions. Final document acceptance and "
            "additional requirements are determined by the competent "
            "Passport Authority."
        ),
        "source": {
            "authority": "Ministry of External Affairs, Government of India",
            "website": "https://www.passportindia.gov.in/",
            "reference": (
                "Instructions for Filling of Passport Application Form "
                "and Supplementary Form, Table 2 and Table 3"
            ),
        },
    }
