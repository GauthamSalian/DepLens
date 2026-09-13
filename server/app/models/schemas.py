"""
Pydantic Schemas for DepLens / RippleLens Graph Analysis Pipeline.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RepositoryItem(BaseModel):
    id: str
    name: str
    owner: str
    full_name: str
    url: str
    description: Optional[str] = None
    default_branch: str = "main"
    language: str = "Python"
    stars: int = 0
    forks: int = 0
    topics: List[str] = []


class VulnerabilityDetail(BaseModel):
    id: str
    summary: str
    details: Optional[str] = None
    cvss: float
    severity_score: int  # CVSS * 10
    affected_package: str
    affected_version_range: str
    fixed_version: Optional[str] = None
    references: List[str] = []


class BlastRadiusDetail(BaseModel):
    affected_dependencies: int
    total_dependencies: int
    dependency_impact: float  # D = (affected / total) * 100
    affected_modules: int
    total_modules: int
    module_impact: float  # M = (affected_modules / total_modules) * 100
    propagation_depth: int  # d
    max_graph_depth: int  # d_max
    depth_ratio: float  # P = (d / d_max) * 100
    blast_radius_score: int  # BR = 50%D + 30%M + 20%P
    affected_nodes: List[str] = []


class RemediationOption(BaseModel):
    action: str  # "UPDATE", "REPLACE", "MITIGATE"
    target_version: Optional[str] = None
    description: str
    residual_risk: int  # OriginalRisk * (1 - F)
    risk_reduction_percent: int
    estimated_effort_hours: float
    estimated_cost_inr: int  # Effort * 1000 INR/hr
    recommended: bool = False
    details: Optional[Dict[str, Any]] = None


class NodeInfo(BaseModel):
    id: str
    name: str
    version: str
    ecosystem: str = "pip"
    type: str = "direct"  # "direct", "transitive", "root"
    direct: bool = True
    dev: bool = False
    vulnerable: bool = False
    cvss: Optional[float] = None
    severity: int = 0  # CVSS * 10
    
    # Graph Topology & Usage
    dependents: int = 0
    dependencies: int = 0
    centrality: int = 0  # Betweenness centrality * 100
    code_usage: int = 10  # Score based on affected file buckets
    affected_files_count: int = 0
    affected_files: List[str] = []
    
    # Blast Radius & Risk
    blast_radius: int = 0
    blast_radius_detail: Optional[BlastRadiusDetail] = None
    risk_score: int = 0  # 35% Severity + 30% BlastRadius + 20% Centrality + 15% CodeUsage
    risk_level: str = "Low"  # Low, Moderate, High, Critical, Severe
    
    # Remediation
    remediation_options: List[RemediationOption] = []
    recommended_action: Optional[str] = None


class EdgeInfo(BaseModel):
    source: str
    target: str
    relation: str = "depends_on"
    propagation_strength: float = 1.0  # Runtime=1.0, Optional=0.5, Dev=0.2


class GraphSummary(BaseModel):
    total_nodes: int
    direct_nodes: int
    transitive_nodes: int
    total_edges: int
    vulnerable_nodes_count: int
    average_risk_score: float
    max_risk_score: int
    max_depth: int


class GraphAnalysisResponse(BaseModel):
    status: str
    repository: RepositoryItem
    analysis_id: str
    timestamp: str
    from_cache: bool = False
    summary: GraphSummary
    nodes: List[NodeInfo]
    edges: List[EdgeInfo]
    vulnerabilities: List[VulnerabilityDetail] = []


class FunctionUsage(BaseModel):
    name: str
    type: str = "function"  # "function", "endpoint", "method", "class"
    line_start: int
    line_end: int
    snippet: str
    imported_symbols_used: List[str] = []


class ImportUsage(BaseModel):
    statement: str
    line: int
    symbols: List[str] = []


class FileUsage(BaseModel):
    file_path: str
    imports: List[ImportUsage] = []
    functions: List[FunctionUsage] = []
    total_usages_count: int = 0


class PackageUsageDetail(BaseModel):
    package: str
    version: str
    vulnerable: bool = False
    severity_score: int = 0
    total_occurrences: int = 0
    affected_files_count: int = 0
    files: List[FileUsage] = []


class UsagesResponse(BaseModel):
    status: str
    repository: str
    timestamp: str
    from_cache: bool = False
    total_vulnerable_packages: int
    total_affected_files: int
    usages: Dict[str, PackageUsageDetail]

