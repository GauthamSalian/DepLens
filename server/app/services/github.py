"""
GitHub & Repository Services.
Handles local and remote repository resolution and manifest loading.
"""

from typing import Optional, Tuple
from pathlib import Path
import re


def resolve_local_repo_path(repo_name: str) -> Optional[Path]:
    """
    Checks if repository exists in local repos/ directory.
    """
    base_dir = Path(__file__).resolve().parent.parent.parent.parent
    repos_dir = base_dir / "repos" / repo_name
    if repos_dir.exists() and repos_dir.is_dir():
        return repos_dir
    return None


def parse_repo_slug(url_or_slug: str) -> Tuple[str, str, str]:
    """
    Returns (owner, repo_name, canonical_url).
    """
    clean = url_or_slug.strip()
    match = re.search(r"github\.com[/:]([\w.-]+)/([\w.-]+?)(?:\.git)?(?:/|$)", clean, re.IGNORECASE)
    if match:
        owner = match.group(1)
        repo_name = match.group(2)
        return owner, repo_name, f"https://github.com/{owner}/{repo_name}.git"

    shorthand = re.match(r"^([\w.-]+)/([\w.-]+?)(?:\.git)?$", clean)
    if shorthand:
        owner = shorthand.group(1)
        repo_name = shorthand.group(2)
        return owner, repo_name, f"https://github.com/{owner}/{repo_name}.git"

    slug = clean.rstrip("/").split("/")[-1].replace(".git", "")
    return "GauthamSalian", slug or "FluxPay-server", clean
