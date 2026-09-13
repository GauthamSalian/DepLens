"""
Repositories API Router.
Provides repository listings and basic details.
"""

from typing import List, Optional
from fastapi import APIRouter, Query
from ..models.schemas import RepositoryItem
from ..services.github import parse_repo_slug

router = APIRouter(prefix="/api/repositories", tags=["repositories"])

HARDCODED_REPOSITORIES: List[RepositoryItem] = [
    RepositoryItem(
        id="fluxpay-server",
        name="FluxPay-server",
        owner="GauthamSalian",
        full_name="GauthamSalian/FluxPay-server",
        url="https://github.com/GauthamSalian/FluxPay-server.git",
        description="Scalable payment orchestration and transaction gateway server",
        default_branch="main",
        language="Python",
        stars=0,
        forks=0,
        topics=["fintech", "payments", "orchestrator", "python", "fastapi"],
    )
]


@router.get("", response_model=List[RepositoryItem])
def get_all_repositories(q: Optional[str] = None):
    """
    Returns available repositories, filtered by optional search query q.
    """
    if not q or not isinstance(q, str):
        return HARDCODED_REPOSITORIES

    query = q.lower().strip()
    filtered = [
        r for r in HARDCODED_REPOSITORIES
        if query in r.name.lower()
        or query in r.full_name.lower()
        or query in r.url.lower()
        or (r.description and query in r.description.lower())
    ]
    return filtered
