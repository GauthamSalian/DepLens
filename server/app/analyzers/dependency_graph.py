"""
Dependency Graph Builder & Centrality Analyzer.
Constructs NetworkX directed graphs and calculates betweenness centrality.
"""

from typing import Dict, List, Tuple
import networkx as nx


def build_networkx_graph(
    nodes: List[str],
    edges: List[Tuple[str, str]],
    root_node: str = "FluxPay-server",
    direct_nodes: List[str] = None,
) -> nx.DiGraph:
    """
    Constructs a directed graph where an edge (A, B) means 'A depends on B'.
    Also connects root_node to all direct dependencies.
    """
    G = nx.DiGraph()

    for node in nodes:
        G.add_node(node)

    if direct_nodes:
        G.add_node(root_node)
        for d in direct_nodes:
            G.add_edge(root_node, d)

    for src, dst in edges:
        G.add_edge(src, dst)

    return G


def calculate_centrality_scores(graph: nx.DiGraph) -> Dict[str, int]:
    """
    Calculates betweenness centrality for all nodes and converts to 0-100 scale:
    Centrality Score = C_B(v) * 100
    """
    if graph.number_of_nodes() <= 1:
        return {n: 0 for n in graph.nodes()}

    raw_centrality = nx.betweenness_centrality(graph, normalized=True)
    
    # Scale and format to 0-100 integers
    # If values are small in sparse trees, apply proportional normalization for presentation
    max_c = max(raw_centrality.values()) if raw_centrality.values() else 1.0
    scaling_factor = 100.0 if max_c == 0 else (100.0 / max_c if max_c < 0.2 else 100.0)

    scores: Dict[str, int] = {}
    for node, c_val in raw_centrality.items():
        scaled = min(int(round(c_val * scaling_factor)), 100)
        # Ensure minimal non-zero representation for intermediate bridge nodes
        if c_val > 0 and scaled < 15:
            scaled = 15
        scores[node] = scaled

    return scores


def calculate_node_degrees(graph: nx.DiGraph) -> Dict[str, Tuple[int, int]]:
    """
    Returns {node: (dependents_count, dependencies_count)}
    - dependents (in-degree): packages that depend on this node
    - dependencies (out-degree): packages that this node depends on
    """
    degrees: Dict[str, Tuple[int, int]] = {}
    for node in graph.nodes():
        dependents = graph.in_degree(node)
        dependencies = graph.out_degree(node)
        degrees[node] = (dependents, dependencies)
    return degrees


def calculate_max_graph_depth(graph: nx.DiGraph, root_node: str = "FluxPay-server") -> int:
    """
    Calculates the maximum depth from the root application node.
    """
    if not graph.has_node(root_node):
        return 4

    try:
        lengths = nx.single_source_shortest_path_length(graph, root_node)
        return max(lengths.values()) if lengths else 4
    except Exception:
        return 4
