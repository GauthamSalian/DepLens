"""
Remediation API Router.
"""

from typing import List, Optional
from fastapi import APIRouter, Query
from ..models.schemas import RemediationOption
from ..analyzers.remediation import generate_remediation_options

router = APIRouter(prefix="/api/remediation", tags=["remediation"])


@router.get("/plan", response_model=List[RemediationOption])
def get_remediation_plan(
    package: str = Query(..., description="Package name to remediate"),
    current_version: str = Query("0.1.0"),
    fixed_version: Optional[str] = Query(None),
    risk_score: int = Query(70),
    affected_files: int = Query(2),
):
    return generate_remediation_options(
        pkg_name=package,
        current_version=current_version,
        fixed_version=fixed_version,
        original_risk=risk_score,
        affected_files_count=affected_files,
    )
