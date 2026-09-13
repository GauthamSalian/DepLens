"""
Dependency Parser Module.
Extracts direct and transitive dependencies from repository manifests.
"""

from typing import Dict, List, Tuple
from pathlib import Path

# Static baseline sub-dependency mapping for Python ecosystem packages
KNOWN_SUB_DEPENDENCIES: Dict[str, List[Tuple[str, str]]] = {
    "fastapi": [("starlette", "0.36.3"), ("pydantic", "2.6.4")],
    "starlette": [("anyio", "4.3.0")],
    "anyio": [("idna", "3.6"), ("sniffio", "1.3.1")],
    "pydantic": [("pydantic-core", "2.16.3"), ("annotated-types", "0.6.0"), ("typing-extensions", "4.10.0")],
    "sqlmodel": [("sqlalchemy", "2.0.28"), ("pydantic", "2.6.4")],
    "sqlalchemy": [("typing-extensions", "4.10.0"), ("greenlet", "3.0.3")],
    "uvicorn": [
        ("click", "8.1.7"),
        ("h11", "0.14.0"),
        ("httptools", "0.6.1"),
        ("python-dotenv", "1.0.1"),
        ("pyyaml", "6.0.1"),
        ("uvloop", "0.19.0"),
        ("watchfiles", "0.21.0"),
        ("websockets", "12.0"),
    ],
    "uvicorn[standard]": [
        ("click", "8.1.7"),
        ("h11", "0.14.0"),
        ("httptools", "0.6.1"),
        ("python-dotenv", "1.0.1"),
        ("pyyaml", "6.0.1"),
        ("uvloop", "0.19.0"),
        ("watchfiles", "0.21.0"),
        ("websockets", "12.0"),
    ],
    "watchfiles": [("anyio", "4.3.0")],
    "sqladmin": [
        ("starlette", "0.36.3"),
        ("sqlalchemy", "2.0.28"),
        ("jinja2", "3.1.3"),
        ("wtforms", "3.1.2"),
    ],
    "jinja2": [("markupsafe", "2.1.5")],
    "wtforms": [("markupsafe", "2.1.5")],
    "supabase": [
        ("gotrue", "2.4.2"),
        ("postgrest", "0.13.2"),
        ("realtime", "1.0.4"),
        ("storage3", "0.7.2"),
        ("supafunc", "0.3.2"),
    ],
    "gotrue": [("httpx", "0.27.0"), ("pydantic", "2.6.4")],
    "postgrest": [("httpx", "0.27.0"), ("pydantic", "2.6.4")],
    "realtime": [("websockets", "12.0")],
    "storage3": [("httpx", "0.27.0")],
    "supafunc": [("httpx", "0.27.0")],
    "httpx": [("httpcore", "1.0.4"), ("certifi", "2024.2.2"), ("idna", "3.6"), ("sniffio", "1.3.1")],
    "httpcore": [("h11", "0.14.0"), ("certifi", "2024.2.2")],
    "twilio": [("requests", "2.31.0"), ("pyjwt", "2.8.0"), ("aiohttp", "3.9.3")],
    "requests": [("urllib3", "2.2.1"), ("certifi", "2024.2.2"), ("charset-normalizer", "3.3.2"), ("idna", "3.6")],
    "aiohttp": [
        ("aiosignal", "1.3.1"),
        ("attrs", "23.2.0"),
        ("frozenlist", "1.4.1"),
        ("multidict", "6.0.5"),
        ("yarl", "1.9.4"),
        ("async-timeout", "4.0.3"),
    ],
    "aiosignal": [("frozenlist", "1.4.1")],
    "yarl": [("multidict", "6.0.5"), ("idna", "3.6")],
}


def parse_requirements_file(file_path: Path) -> List[Tuple[str, str]]:
    """
    Parses a requirements.txt file and returns a list of (pkg_name, pkg_version).
    """
    results: List[Tuple[str, str]] = []
    if not file_path.exists():
        return results

    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "==" in line:
                name, ver = line.split("==", 1)
                results.append((name.strip(), ver.strip()))
            elif ">=" in line:
                name, ver = line.split(">=", 1)
                results.append((name.strip(), ver.strip()))
            else:
                results.append((line.strip(), "0.0.1"))
    return results


def resolve_full_dependency_tree(direct_deps: List[Tuple[str, str]]) -> Tuple[Dict[str, str], List[Tuple[str, str]]]:
    """
    Recursively resolves the complete dependency map and directed edges.
    Returns:
      - versions_map: {pkg_name: version}
      - edges: list of (parent_pkg, child_pkg)
    """
    versions_map: Dict[str, str] = {}
    edges: List[Tuple[str, str]] = []
    visited = set()

    # Add direct deps
    queue: List[str] = []
    for name, ver in direct_deps:
        clean_name = name.split("[")[0].lower()
        versions_map[clean_name] = ver
        queue.append(clean_name)

    while queue:
        current = queue.pop(0)
        if current in visited:
            continue
        visited.add(current)

        # Lookup sub-dependencies
        sub_deps = KNOWN_SUB_DEPENDENCIES.get(current, [])
        for child_name, child_ver in sub_deps:
            clean_child = child_name.split("[")[0].lower()
            if clean_child not in versions_map:
                versions_map[clean_child] = child_ver
            edges.append((current, clean_child))
            if clean_child not in visited:
                queue.append(clean_child)

    return versions_map, edges
