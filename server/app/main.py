"""
DepLens / RippleLens Main FastAPI Application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.repositories import router as repositories_router
from .api.analysis import router as analysis_router, AnalyzeRequest, run_pipeline
from .api.vulnerabilities import router as vulnerabilities_router
from .api.remediation import router as remediation_router
from .api.usages import router as usages_router
from .services.github import parse_repo_slug
from .models.schemas import RepositoryItem

app = FastAPI(
    title="DepLens / RippleLens Supply Chain Intelligence API",
    description="Backend API service for dependency graphing, blast radius, centrality, and risk scoring",
    version="2.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(repositories_router)
app.include_router(analysis_router)
app.include_router(vulnerabilities_router)
app.include_router(remediation_router)
app.include_router(usages_router)


# Backward compatibility for search bar analyze endpoint
@app.post("/api/repositories/analyze")
def legacy_analyze_repo(request: AnalyzeRequest):
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
    graph_res = run_pipeline(repo_item, force_refresh=request.force_refresh)
    
    # Map to search bar summary format
    direct_packages = [
        {
            "name": node.name,
            "version": node.version,
            "latest_version": node.remediation_options[0].target_version if node.remediation_options else node.version,
            "is_outdated": bool(node.remediation_options) or node.vulnerable,
            "vulnerabilities_count": 1 if node.vulnerable else 0,
            "license": "MIT" if node.name != "psycopg2-binary" else "LGPL",
        }
        for node in graph_res.nodes if node.direct
    ]

    return {
        "status": "success",
        "message": f"Successfully parsed dependencies for {repo_item.full_name}",
        "repo": repo_item.model_dump(),
        "analysis_id": graph_res.analysis_id,
        "dependencies": {
            "total": graph_res.summary.total_nodes,
            "direct": graph_res.summary.direct_nodes,
            "transitive": graph_res.summary.transitive_nodes,
            "outdated": sum(1 for p in direct_packages if p["is_outdated"]),
            "vulnerabilities": graph_res.summary.vulnerable_nodes_count,
        },
        "packages": direct_packages,
        "default_branch": repo_item.default_branch,
        "available_branches": ["main"],
        "graph_data": graph_res.model_dump(),
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "DepLens / RippleLens API v2.0"}
