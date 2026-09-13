"""
Vulnerabilities API Router.
"""

from typing import List
from fastapi import APIRouter
from ..models.schemas import VulnerabilityDetail
from ..analyzers.vulnerability_scanner import VULNERABILITY_DATABASE

router = APIRouter(prefix="/api/vulnerabilities", tags=["vulnerabilities"])


@router.get("", response_model=List[VulnerabilityDetail])
def list_known_vulnerabilities():
    items: List[VulnerabilityDetail] = []
    for pkg, vulns in VULNERABILITY_DATABASE.items():
        for v in vulns:
            cvss = float(v["cvss"])
            items.append(
                VulnerabilityDetail(
                    id=v["id"],
                    summary=v["summary"],
                    details=v.get("details"),
                    cvss=cvss,
                    severity_score=int(round(cvss * 10)),
                    affected_package=pkg,
                    affected_version_range=v["affected_version_range"],
                    fixed_version=v.get("fixed_version"),
                    references=v.get("references", []),
                )
            )
    return items
