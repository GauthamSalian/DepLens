"""
Risk Score Calculator Module.
Computes composite DepLens risk scores and categories.
"""

from typing import Tuple


def map_risk_level(risk_score: int) -> str:
    """
    Maps 0-100 risk score to DepLens risk levels:
    0-29   -> Low
    30-49  -> Moderate
    50-69  -> High
    70-84  -> Critical
    85-100 -> Severe
    """
    if risk_score <= 29:
        return "Low"
    elif risk_score <= 49:
        return "Moderate"
    elif risk_score <= 69:
        return "High"
    elif risk_score <= 84:
        return "Critical"
    else:
        return "Severe"


def calculate_risk_score(
    severity: int,
    blast_radius: int,
    centrality: int,
    code_usage: int,
) -> Tuple[int, str]:
    """
    Formula:
    Risk = 35% * Severity + 30% * BlastRadius + 20% * Centrality + 15% * CodeUsage
    
    Returns: (risk_score, risk_level)
    """
    raw_risk = (
        (severity * 0.35)
        + (blast_radius * 0.30)
        + (centrality * 0.20)
        + (code_usage * 0.15)
    )
    final_score = int(round(min(max(raw_risk, 0), 100)))
    level = map_risk_level(final_score)
    return final_score, level
