"""
Blast Radius Analyzer.
Simulates compromise propagation backwards through the dependency graph.
"""

from typing import Dict, List, Set, Tuple
import networkx as nx
from ..models.schemas import BlastRadiusDetail


def calculate_blast_radius(
    graph: nx.DiGraph,
    vulnerable_node: str,
    total_dependencies: int,
    total_modules: int = 12,
    max_graph_depth: int = 4,
    affected_files_count: int = 0,
) -> BlastRadiusDetail:
    """
    Performs reverse BFS traversal to find all ancestors/dependents affected by vulnerable_node.
    
    Formulas:
    - Dependency Impact: D = (Affected Dependencies / Total Dependencies) * 100
    - Module Impact:     M = (Affected Modules / Total Modules) * 100
    - Propagation Depth: P = (d / d_max) * 100
    - Blast Radius Score: BR = 50% * D + 30% * M + 20% * P
    """
    if not graph.has_node(vulnerable_node):
        return BlastRadiusDetail(
            affected_dependencies=1,
            total_dependencies=total_dependencies,
            dependency_impact=round((1 / max(total_dependencies, 1)) * 100, 2),
            affected_modules=1,
            total_modules=total_modules,
            module_impact=round((1 / max(total_modules, 1)) * 100, 2),
            propagation_depth=1,
            max_graph_depth=max_graph_depth,
            depth_ratio=25.0,
            blast_radius_score=20,
            affected_nodes=[vulnerable_node],
        )

    # Reverse graph: edge (A, B) in G means A depends on B.
    # In reversed graph, edges point from B (vulnerable package) to A (dependent).
    rev_G = graph.reverse(copy=True)

    # BFS from vulnerable_node to find all dependent nodes
    try:
        lengths = nx.single_source_shortest_path_length(rev_G, vulnerable_node)
    except Exception:
        lengths = {vulnerable_node: 0}

    affected_nodes = [node for node in lengths.keys() if node != "FluxPay-server"]
    affected_deps_count = len(affected_nodes)

    # A. Dependency Impact D
    D = (affected_deps_count / max(total_dependencies, 1)) * 100.0

    # B. Module/Service Impact M (incorporating affected source files)
    affected_modules = max(affected_files_count, len(affected_nodes) // 2 + 1)
    M = (affected_modules / max(total_modules, 1)) * 100.0

    # C. Propagation Depth P
    max_d = max(lengths.values()) if lengths else 1
    P = (max_d / max(max_graph_depth, 1)) * 100.0

    # Blast Radius formula: BR = 50% * D + 30% * M + 20% * P
    raw_br = (0.50 * D) + (0.30 * M) + (0.20 * P)
    br_score = int(round(min(max(raw_br, 10), 100)))

    return BlastRadiusDetail(
        affected_dependencies=affected_deps_count,
        total_dependencies=total_dependencies,
        dependency_impact=round(D, 2),
        affected_modules=affected_modules,
        total_modules=total_modules,
        module_impact=round(M, 2),
        propagation_depth=max_d,
        max_graph_depth=max_graph_depth,
        depth_ratio=round(P, 2),
        blast_radius_score=br_score,
        affected_nodes=affected_nodes,
    )
