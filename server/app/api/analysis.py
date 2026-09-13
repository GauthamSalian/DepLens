"""
Analysis API Router.
Executes the full ChainShield / RippleLens graph pipeline with caching.
"""

from typing import Dict, List, Optional
from pathlib import Path
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ..models.schemas import (
    GraphAnalysisResponse,
    GraphSummary,
    NodeInfo,
    EdgeInfo,
    RepositoryItem,
    VulnerabilityDetail,
)
from ..analyzers.dependency_parser import parse_requirements_file, resolve_full_dependency_tree
from ..analyzers.dependency_graph import (
    build_networkx_graph,
    calculate_centrality_scores,
    calculate_node_degrees,
    calculate_max_graph_depth,
)
from ..analyzers.code_usage import analyze_code_usage
from ..analyzers.vulnerability_scanner import scan_all_vulnerabilities
from ..analyzers.blast_radius import calculate_blast_radius
from ..analyzers.risk_score import calculate_risk_score
from ..analyzers.remediation import generate_remediation_options
from ..services.github import resolve_local_repo_path, parse_repo_slug

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


class AnalyzeRequest(BaseModel):
    repo_url: str
    force_refresh: bool = False


def _get_cache_path(repo_name: str, branch: str = "main") -> Path:
    clean_name = repo_name.lower().replace("/", "_").replace(".git", "")
    return CACHE_DIR / f"analysis_{clean_name}_{branch}.json"


def run_pipeline(repo_item: RepositoryItem, force_refresh: bool = False) -> GraphAnalysisResponse:
    """
    Executes the comprehensive graph analysis pipeline with disk caching.
    """
    cache_file = _get_cache_path(repo_item.name, repo_item.default_branch)

    # Return cached data if available and not forced
    if cache_file.exists() and not force_refresh:
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
                cached_data["from_cache"] = True
                return GraphAnalysisResponse(**cached_data)
        except Exception as e:
            print(f"Failed to read cache file {cache_file}: {e}")

    # 1. Resolve repository path & requirements
    local_repo = resolve_local_repo_path(repo_item.name)
    direct_deps = []
    if local_repo:
        direct_deps = parse_requirements_file(local_repo / "requirements.txt")

    if not direct_deps:
        # Default baseline
        direct_deps = [
            ("fastapi", "0.110.0"),
            ("sqlmodel", "0.0.16"),
            ("psycopg2-binary", "2.9.9"),
            ("python-dotenv", "1.0.1"),
            ("uvicorn[standard]", "0.28.0"),
            ("sqladmin", "0.16.1"),
            ("itsdangerous", "2.1.2"),
            ("supabase", "2.3.4"),
            ("bcrypt", "4.1.2"),
            ("twilio", "9.0.2"),
        ]

    # 2. Resolve complete dependency tree & edges
    versions_map, raw_edges = resolve_full_dependency_tree(direct_deps)
    direct_names = [d[0].split("[")[0].lower() for d in direct_deps]
    all_pkg_names = list(versions_map.keys())

    # 3. Build NetworkX Graph
    graph = build_networkx_graph(
        nodes=all_pkg_names,
        edges=raw_edges,
        root_node=repo_item.name,
        direct_nodes=direct_names,
    )

    # 4. Centrality Analysis C_B(v) * 100
    centrality_scores = calculate_centrality_scores(graph)
    node_degrees = calculate_node_degrees(graph)
    max_depth = calculate_max_graph_depth(graph, root_node=repo_item.name)

    # 5. Code Usage Scoring (0->10, 1-2->30, 3-5->60, 6-10->80, >10->100)
    code_usage_data = analyze_code_usage(local_repo or Path(), all_pkg_names)

    # 6. Vulnerability Scanning & Severity = CVSS * 10
    vulnerabilities = scan_all_vulnerabilities(versions_map)

    # 7. Blast Radius & Risk Score Calculation
    total_dependencies = len(all_pkg_names)
    total_modules = 12

    nodes_list: List[NodeInfo] = []
    vulnerabilities_list: List[VulnerabilityDetail] = list(vulnerabilities.values())

    for pkg_name in all_pkg_names:
        clean_name = pkg_name.lower()
        ver = versions_map.get(clean_name, "1.0.0")
        is_direct = clean_name in direct_names
        is_vuln = clean_name in vulnerabilities
        vuln_info = vulnerabilities.get(clean_name)

        # Severity Score
        severity = vuln_info.severity_score if vuln_info else 0
        cvss_val = vuln_info.cvss if vuln_info else None

        # Topology
        dependents_cnt, dependencies_cnt = node_degrees.get(clean_name, (0, 0))
        centrality = centrality_scores.get(clean_name, 0)

        # Code usage
        usage_score, files_cnt, files_list = code_usage_data.get(clean_name, (10, 0, []))

        # Blast Radius
        blast_detail = calculate_blast_radius(
            graph=graph,
            vulnerable_node=clean_name,
            total_dependencies=total_dependencies,
            total_modules=total_modules,
            max_graph_depth=max_depth,
            affected_files_count=files_cnt,
        )
        blast_radius_score = blast_detail.blast_radius_score if is_vuln else (blast_detail.blast_radius_score // 2)

        # Final Risk Score: 35% Severity + 30% BlastRadius + 20% Centrality + 15% CodeUsage
        risk_score, risk_level = calculate_risk_score(
            severity=severity,
            blast_radius=blast_radius_score,
            centrality=centrality,
            code_usage=usage_score,
        )

        # Remediation Strategy
        remediation_opts = []
        rec_action = None
        if is_vuln:
            remediation_opts = generate_remediation_options(
                pkg_name=clean_name,
                current_version=ver,
                fixed_version=vuln_info.fixed_version if vuln_info else None,
                original_risk=risk_score,
                affected_files_count=files_cnt,
            )
            rec = next((opt.action for opt in remediation_opts if opt.recommended), "UPDATE")
            rec_action = rec

        nodes_list.append(
            NodeInfo(
                id=clean_name,
                name=clean_name,
                version=ver,
                ecosystem="pip",
                type="direct" if is_direct else "transitive",
                direct=is_direct,
                dev=False,
                vulnerable=is_vuln,
                cvss=cvss_val,
                severity=severity,
                dependents=dependents_cnt,
                dependencies=dependencies_cnt,
                centrality=centrality,
                code_usage=usage_score,
                affected_files_count=files_cnt,
                affected_files=files_list,
                blast_radius=blast_radius_score,
                blast_radius_detail=blast_detail,
                risk_score=risk_score,
                risk_level=risk_level,
                remediation_options=remediation_opts,
                recommended_action=rec_action,
            )
        )

    # Format edges
    edges_list: List[EdgeInfo] = []
    for src, dst in raw_edges:
        edges_list.append(
            EdgeInfo(
                source=src,
                target=dst,
                relation="depends_on",
                propagation_strength=1.0,
            )
        )

    # Summary
    summary = GraphSummary(
        total_nodes=len(nodes_list),
        direct_nodes=len(direct_names),
        transitive_nodes=len(nodes_list) - len(direct_names),
        total_edges=len(edges_list),
        vulnerable_nodes_count=len(vulnerabilities_list),
        average_risk_score=round(sum(n.risk_score for n in nodes_list) / max(len(nodes_list), 1), 1),
        max_risk_score=max((n.risk_score for n in nodes_list), default=0),
        max_depth=max_depth,
    )

    response = GraphAnalysisResponse(
        status="success",
        repository=repo_item,
        analysis_id=f"analysis_{repo_item.name.lower()}_{repo_item.default_branch}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        from_cache=False,
        summary=summary,
        nodes=nodes_list,
        edges=edges_list,
        vulnerabilities=vulnerabilities_list,
    )

    # Save to disk cache
    try:
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(response.model_dump(), f, indent=2)
    except Exception as e:
        print(f"Failed to write cache file {cache_file}: {e}")

    return response


@router.get("/graph", response_model=GraphAnalysisResponse)
def get_graph_analysis(
    repo_url: str = Query("https://github.com/GauthamSalian/FluxPay-server.git"),
    force_refresh: bool = Query(False),
):
    owner, repo_name, canonical = parse_repo_slug(repo_url)
    repo_item = RepositoryItem(
        id=f"{owner.lower()}-{repo_name.lower()}",
        name=repo_name,
        owner=owner,
        full_name=f"{owner}/{repo_name}",
        url=canonical,
        description="Scalable payment orchestration and transaction gateway server",
        default_branch="main",
        language="Python",
        stars=0,
        forks=0,
        topics=["fintech", "payments", "orchestrator", "python", "fastapi"],
    )
    return run_pipeline(repo_item, force_refresh=force_refresh)


@router.post("/graph", response_model=GraphAnalysisResponse)
def analyze_graph_post(request: AnalyzeRequest):
    owner, repo_name, canonical = parse_repo_slug(request.repo_url)
    repo_item = RepositoryItem(
        id=f"{owner.lower()}-{repo_name.lower()}",
        name=repo_name,
        owner=owner,
        full_name=f"{owner}/{repo_name}",
        url=canonical,
        description="Scalable payment orchestration and transaction gateway server",
        default_branch="main",
        language="Python",
        stars=0,
        forks=0,
        topics=["fintech", "payments", "orchestrator", "python", "fastapi"],
    )
    return run_pipeline(repo_item, force_refresh=request.force_refresh)
