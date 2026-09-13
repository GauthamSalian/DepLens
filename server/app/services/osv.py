"""
OSV (Open Source Vulnerabilities) & NVD Service.
"""

from typing import Dict, List, Optional
from ..models.schemas import VulnerabilityDetail
from ..analyzers.vulnerability_scanner import VULNERABILITY_DATABASE


def get_vulnerability_info(pkg_name: str, version: str) -> Optional[VulnerabilityDetail]:
    """
    Looks up CVE information from the vulnerability database.
    """
    clean_name = pkg_name.lower().split("[")[0]
    entries = VULNERABILITY_DATABASE.get(clean_name, [])
    if not entries:
        return None

    entry = entries[0]
    cvss = float(entry["cvss"])
    return VulnerabilityDetail(
        id=entry["id"],
        summary=entry["summary"],
        details=entry.get("details"),
        cvss=cvss,
        severity_score=int(round(cvss * 10)),
        affected_package=pkg_name,
        affected_version_range=entry["affected_version_range"],
        fixed_version=entry.get("fixed_version"),
        references=entry.get("references", []),
    )
