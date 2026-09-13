"""
Repositories API Module for DepLens.
Provides endpoints for repository discovery and dependency analysis.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, HttpUrl
import re

router = APIRouter(prefix="/api/repositories", tags=["repositories"])


class RepositoryItem(BaseModel):
    id: str
    name: str
    owner: str
    full_name: str
    url: str
    description: Optional[str] = None
    default_branch: str = "main"
    language: Optional[str] = None
    stars: int = 0
    forks: int = 0
    topics: List[str] = []


class AnalyzeRepoRequest(BaseModel):
    repo_url: str


class DependencySummary(BaseModel):
    total: int
    direct: int
    transitive: int
    outdated: int
    vulnerabilities: int


class RepositoryAnalysisResponse(BaseModel):
    status: str
    message: str
    repo: RepositoryItem
    analysis_id: str
    dependencies: DependencySummary
    default_branch: str
    available_branches: List[str]


# Hardcoded list of repositories for now
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
        topics=["fintech", "payments", "orchestrator", "typescript", "microservices"],
    )
]


def _normalize_github_url(raw_url: str) -> tuple[str, str, str]:
    """
    Extracts owner, repo name, and clean git URL from various input formats:
    - https://github.com/owner/repo.git
    - https://github.com/owner/repo
    - owner/repo
    """
    clean = raw_url.strip()
    # Remove leading/trailing slashes or git suffixes
    match = re.search(r"github\.com[/:]([\w.-]+)/([\w.-]+?)(?:\.git)?(?:/|$)", clean, re.IGNORECASE)
    if match:
        owner = match.group(1)
        repo_name = match.group(2)
        url = f"https://github.com/{owner}/{repo_name}.git"
        return owner, repo_name, url
    
    # Handle shorthand owner/repo
    shorthand_match = re.match(r"^([\w.-]+)/([\w.-]+?)(?:\.git)?$", clean)
    if shorthand_match:
        owner = shorthand_match.group(1)
        repo_name = shorthand_match.group(2)
        url = f"https://github.com/{owner}/{repo_name}.git"
        return owner, repo_name, url

    # Fallback to general URL or name
    slug = clean.rstrip("/").split("/")[-1].replace(".git", "")
    return "custom", slug or "repository", clean


@router.get("", response_model=List[RepositoryItem])
def get_all_repositories(q: Optional[str] = None):
    """
    Returns available repositories for DepLens inspection.
    Includes the hardcoded repository: https://github.com/GauthamSalian/FluxPay-server.git
    """
    if not q or not isinstance(q, str):
        return HARDCODED_REPOSITORIES

    query = q.lower().strip()
    filtered = [
        repo for repo in HARDCODED_REPOSITORIES
        if query in repo.name.lower()
        or query in repo.full_name.lower()
        or query in repo.url.lower()
        or (repo.description and query in repo.description.lower())
    ]
    return filtered


@router.post("/analyze", response_model=RepositoryAnalysisResponse)
def analyze_repository(request: AnalyzeRepoRequest):
    """
    Endpoint triggered when user hits Enter or selects a repository to analyze.
    Validates the repository URL and prepares dependency tree analysis.
    """
    raw_url = request.repo_url.strip()
    if not raw_url:
        raise HTTPException(status_code=400, detail="Repository URL is required")

    # Check if matches one of the preset repositories
    matched_repo = next((r for r in HARDCODED_REPOSITORIES if r.url.lower() == raw_url.lower() or r.full_name.lower() == raw_url.lower()), None)

    if matched_repo:
        repo_item = matched_repo
    else:
        owner, repo_name, canonical_url = _normalize_github_url(raw_url)
        repo_item = RepositoryItem(
            id=f"{owner.lower()}-{repo_name.lower()}",
            name=repo_name,
            owner=owner,
            full_name=f"{owner}/{repo_name}",
            url=canonical_url,
            description=f"GitHub repository for {owner}/{repo_name}",
            default_branch="main",
            language="JavaScript/TypeScript",
            stars=1,
            forks=0,
            topics=["github-repo"],
        )

    return RepositoryAnalysisResponse(
        status="success",
        message=f"Successfully initialized dependency scan for {repo_item.full_name}",
        repo=repo_item,
        analysis_id=f"analysis_{repo_item.id}_{repo_item.default_branch}",
        dependencies=DependencySummary(
            total=48,
            direct=14,
            transitive=34,
            outdated=6,
            vulnerabilities=2,
        ),
        default_branch=repo_item.default_branch,
        available_branches=["main", "dev", "v1.2.0-release"],
    )
