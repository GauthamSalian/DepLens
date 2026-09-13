"""
Remediation Service Module.
"""

from typing import List, Optional
from ..models.schemas import RemediationOption
from ..analyzers.remediation import generate_remediation_options


def get_remediation_plan(
    pkg_name: str,
    current_version: str,
    fixed_version: Optional[str],
    original_risk: int,
    affected_files_count: int = 2,
) -> List[RemediationOption]:
    return generate_remediation_options(
        pkg_name=pkg_name,
        current_version=current_version,
        fixed_version=fixed_version,
        original_risk=original_risk,
        affected_files_count=affected_files_count,
    )
